-- ===================================
-- MESSAGING SYSTEM SETUP FOR COACHFLOW
-- ===================================
-- Run this script in Supabase SQL Editor to set up the messaging system

-- Drop existing tables if they exist (be careful in production!)
DROP TABLE IF EXISTS public.message_notifications CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.message_threads CASCADE;

-- Create message threads table
CREATE TABLE public.message_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID REFERENCES public.message_threads(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create message notifications table
CREATE TABLE public.message_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES public.message_threads(id) ON DELETE CASCADE,
  unread_count INT DEFAULT 0,
  last_notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, thread_id)
);

-- Create indexes for performance
CREATE INDEX idx_message_threads_coach_id ON public.message_threads(coach_id);
CREATE INDEX idx_message_threads_org_id ON public.message_threads(org_id);
CREATE INDEX idx_message_threads_application_id ON public.message_threads(application_id);
CREATE INDEX idx_message_threads_listing_id ON public.message_threads(listing_id);
CREATE INDEX idx_message_threads_status ON public.message_threads(status);
CREATE INDEX idx_message_threads_last_message ON public.message_threads(last_message_at DESC);

CREATE INDEX idx_messages_thread_id ON public.messages(thread_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

CREATE INDEX idx_message_notifications_user_id ON public.message_notifications(user_id);
CREATE INDEX idx_message_notifications_thread_id ON public.message_notifications(thread_id);

-- Enable RLS on all tables
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_notifications ENABLE ROW LEVEL SECURITY;

-- Message threads policies
CREATE POLICY "Users can view their own message threads"
  ON public.message_threads FOR SELECT
  USING (auth.uid() IN (coach_id, org_id));

CREATE POLICY "Users can create message threads for their applications"
  ON public.message_threads FOR INSERT
  WITH CHECK (auth.uid() IN (coach_id, org_id));

CREATE POLICY "Users can update their own message threads"
  ON public.message_threads FOR UPDATE
  USING (auth.uid() IN (coach_id, org_id));

-- Messages policies
CREATE POLICY "Users can view messages in their threads"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.message_threads
      WHERE message_threads.id = messages.thread_id
      AND auth.uid() IN (message_threads.coach_id, message_threads.org_id)
    )
  );

CREATE POLICY "Users can send messages in their threads"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.message_threads
      WHERE message_threads.id = thread_id
      AND auth.uid() IN (message_threads.coach_id, message_threads.org_id)
      AND message_threads.status = 'active'
    )
  );

-- Message notifications policies
CREATE POLICY "Users can view their own notifications"
  ON public.message_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.message_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage all notifications"
  ON public.message_notifications FOR ALL
  USING (true);

-- Function to create or get message thread
CREATE OR REPLACE FUNCTION get_or_create_message_thread(
  p_application_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_thread_id UUID;
  v_coach_id UUID;
  v_org_id UUID;
  v_listing_id UUID;
BEGIN
  -- Get application details
  SELECT a.coach_id, a.listing_id, l.org_id
  INTO v_coach_id, v_listing_id, v_org_id
  FROM public.applications a
  JOIN public.listings l ON l.id = a.listing_id
  WHERE a.id = p_application_id;

  -- Check if thread already exists
  SELECT id INTO v_thread_id
  FROM public.message_threads
  WHERE application_id = p_application_id;

  -- Create new thread if it doesn't exist
  IF v_thread_id IS NULL THEN
    INSERT INTO public.message_threads (
      application_id,
      listing_id,
      coach_id,
      org_id
    ) VALUES (
      p_application_id,
      v_listing_id,
      v_coach_id,
      v_org_id
    )
    RETURNING id INTO v_thread_id;

    -- Create notifications for both users
    INSERT INTO public.message_notifications (user_id, thread_id, unread_count)
    VALUES
      (v_coach_id, v_thread_id, 0),
      (v_org_id, v_thread_id, 0)
    ON CONFLICT (user_id, thread_id) DO NOTHING;
  END IF;

  RETURN v_thread_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update notification counts
CREATE OR REPLACE FUNCTION update_message_notifications()
RETURNS TRIGGER AS $$
DECLARE
  v_recipient_id UUID;
BEGIN
  -- Update thread's last message timestamp
  UPDATE public.message_threads
  SET last_message_at = NEW.created_at
  WHERE id = NEW.thread_id;

  -- Get the recipient (the other person in the thread)
  SELECT
    CASE
      WHEN mt.coach_id = NEW.sender_id THEN mt.org_id
      ELSE mt.coach_id
    END INTO v_recipient_id
    FROM public.message_threads mt
    WHERE mt.id = NEW.thread_id;

  -- Update or create notification for recipient
  INSERT INTO public.message_notifications (
    user_id,
    thread_id,
    unread_count
  ) VALUES (
    v_recipient_id,
    NEW.thread_id,
    1
  )
  ON CONFLICT (user_id, thread_id)
  DO UPDATE SET
    unread_count = message_notifications.unread_count + 1,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new messages
CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_message_notifications();

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(
  p_thread_id UUID,
  p_user_id UUID
)
RETURNS void AS $$
BEGIN
  -- Mark all messages in thread as read for this user
  UPDATE public.messages
  SET is_read = true
  WHERE thread_id = p_thread_id
  AND sender_id != p_user_id
  AND is_read = false;

  -- Reset notification count
  UPDATE public.message_notifications
  SET unread_count = 0,
      updated_at = NOW()
  WHERE thread_id = p_thread_id
  AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_notifications;

-- Grant necessary permissions
GRANT ALL ON public.message_threads TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.message_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_message_thread TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_read TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Messaging system setup completed successfully!';
END $$;