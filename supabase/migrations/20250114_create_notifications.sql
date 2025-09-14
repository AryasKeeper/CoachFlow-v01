-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  read_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_type CHECK (type IN (
    'new_application',
    'application_accepted',
    'application_rejected',
    'application_viewed',
    'booking_request',
    'booking_confirmed',
    'booking_declined',
    'booking_reminder',
    'booking_cancelled',
    'listing_approved',
    'listing_rejected',
    'listing_expiring',
    'profile_verified',
    'profile_incomplete',
    'review_received',
    'achievement_unlocked',
    'system_update',
    'maintenance',
    'feature_announcement'
  )),
  CONSTRAINT valid_category CHECK (category IN (
    'application',
    'booking',
    'listing',
    'profile',
    'system'
  ))
);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_read_status ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_category ON notifications(category);
CREATE INDEX idx_notifications_priority ON notifications(priority);

-- Add notification preferences to coach_profiles
ALTER TABLE coach_profiles
ADD COLUMN IF NOT EXISTS notification_channels JSONB DEFAULT '{
  "in_app": true,
  "email": true,
  "email_digest": "daily",
  "quiet_hours_start": "22:00",
  "quiet_hours_end": "08:00",
  "timezone": "Australia/Sydney"
}'::jsonb;

ALTER TABLE coach_profiles
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "applications": {
    "new_application": true,
    "application_viewed": true,
    "application_status": true
  },
  "bookings": {
    "booking_request": true,
    "booking_confirmed": true,
    "booking_reminder": true,
    "booking_cancelled": true
  },
  "listings": {
    "listing_status": true,
    "listing_expiring": true,
    "high_interest": true
  },
  "profile": {
    "verification": true,
    "reviews": true,
    "achievements": true
  },
  "system": {
    "updates": true,
    "maintenance": true,
    "features": false
  }
}'::jsonb;

-- Add notification preferences to organization_profiles
ALTER TABLE organization_profiles
ADD COLUMN IF NOT EXISTS notification_channels JSONB DEFAULT '{
  "in_app": true,
  "email": true,
  "email_digest": "immediate",
  "quiet_hours_start": "22:00",
  "quiet_hours_end": "08:00",
  "timezone": "Australia/Sydney"
}'::jsonb;

ALTER TABLE organization_profiles
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "applications": {
    "new_application": true,
    "application_withdrawn": true
  },
  "bookings": {
    "booking_confirmed": true,
    "booking_cancelled": true
  },
  "listings": {
    "listing_expiring": true,
    "listing_applications": true
  },
  "system": {
    "updates": true,
    "maintenance": true,
    "features": true
  }
}'::jsonb;

-- Create function to notify on new application
CREATE OR REPLACE FUNCTION notify_new_application()
RETURNS TRIGGER AS $$
DECLARE
  listing_record RECORD;
  coach_record RECORD;
  org_record RECORD;
BEGIN
  -- Get listing details
  SELECT l.*, op.name as org_name
  FROM listings l
  LEFT JOIN organization_profiles op ON op.user_id = l.org_id
  WHERE l.id = NEW.listing_id
  INTO listing_record;

  -- Get coach details
  SELECT u.*, cp.*
  FROM auth.users u
  LEFT JOIN coach_profiles cp ON cp.user_id = u.id
  WHERE u.id = NEW.coach_id
  INTO coach_record;

  -- Notify the organization about new application
  IF listing_record.org_id IS NOT NULL THEN
    INSERT INTO notifications (
      user_id,
      type,
      category,
      title,
      body,
      metadata,
      priority
    ) VALUES (
      listing_record.org_id,
      'new_application',
      'application',
      'New Application Received',
      COALESCE(coach_record.first_name || ' ' || coach_record.last_name, 'A coach') ||
        ' has applied to your listing: ' || listing_record.title,
      jsonb_build_object(
        'entity_type', 'application',
        'entity_id', NEW.id,
        'listing_id', NEW.listing_id,
        'coach_id', NEW.coach_id,
        'coach_name', COALESCE(coach_record.first_name || ' ' || coach_record.last_name, 'Unknown'),
        'action_url', '/org/applications/' || NEW.id
      ),
      'high'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new applications
DROP TRIGGER IF EXISTS trigger_notify_new_application ON applications;
CREATE TRIGGER trigger_notify_new_application
  AFTER INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_application();

-- Create function to notify on application status change
CREATE OR REPLACE FUNCTION notify_application_status_change()
RETURNS TRIGGER AS $$
DECLARE
  listing_record RECORD;
  org_record RECORD;
  status_text TEXT;
  notification_type TEXT;
BEGIN
  -- Only notify if status actually changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get listing and org details
  SELECT l.*, op.name as org_name
  FROM listings l
  LEFT JOIN organization_profiles op ON op.user_id = l.org_id
  WHERE l.id = NEW.listing_id
  INTO listing_record;

  -- Set notification type and text based on status
  CASE NEW.status
    WHEN 'accepted' THEN
      notification_type := 'application_accepted';
      status_text := 'Congratulations! Your application has been accepted';
    WHEN 'rejected' THEN
      notification_type := 'application_rejected';
      status_text := 'Your application status has been updated';
    WHEN 'withdrawn' THEN
      RETURN NEW; -- Don't notify on withdrawal
    ELSE
      RETURN NEW;
  END CASE;

  -- Notify the coach about status change
  INSERT INTO notifications (
    user_id,
    type,
    category,
    title,
    body,
    metadata,
    priority
  ) VALUES (
    NEW.coach_id,
    notification_type,
    'application',
    status_text,
    'Your application for "' || listing_record.title || '" at ' ||
      COALESCE(listing_record.org_name, 'the organization') ||
      CASE
        WHEN NEW.status = 'accepted' THEN
          ' has been accepted! Contact details have been shared with you.'
        ELSE
          ' has been updated.'
      END,
    jsonb_build_object(
      'entity_type', 'application',
      'entity_id', NEW.id,
      'listing_id', NEW.listing_id,
      'status', NEW.status,
      'action_url', '/coach/applications/' || NEW.id,
      'contact_details', CASE
        WHEN NEW.status = 'accepted' THEN
          jsonb_build_object(
            'email', listing_record.contact_email,
            'phone', listing_record.contact_phone
          )
        ELSE NULL
      END
    ),
    CASE NEW.status
      WHEN 'accepted' THEN 'high'
      ELSE 'medium'
    END
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for application status changes
DROP TRIGGER IF EXISTS trigger_notify_application_status ON applications;
CREATE TRIGGER trigger_notify_application_status
  AFTER UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_application_status_change();

-- Create function to notify on booking creation
CREATE OR REPLACE FUNCTION notify_new_booking()
RETURNS TRIGGER AS $$
DECLARE
  coach_record RECORD;
  org_record RECORD;
BEGIN
  -- Get coach details
  SELECT u.*, cp.*
  FROM auth.users u
  LEFT JOIN coach_profiles cp ON cp.user_id = u.id
  WHERE u.id = NEW.coach_id
  INTO coach_record;

  -- Get org details
  SELECT u.*, op.*
  FROM auth.users u
  LEFT JOIN organization_profiles op ON op.user_id = u.id
  WHERE u.id = NEW.org_id
  INTO org_record;

  -- Notify the coach about new booking
  INSERT INTO notifications (
    user_id,
    type,
    category,
    title,
    body,
    metadata,
    priority
  ) VALUES (
    NEW.coach_id,
    'booking_request',
    'booking',
    'New Booking Request',
    COALESCE(org_record.name, 'An organization') || ' has requested a booking for ' ||
      TO_CHAR(NEW.date, 'Day, DD Month YYYY'),
    jsonb_build_object(
      'entity_type', 'booking',
      'entity_id', NEW.id,
      'org_name', COALESCE(org_record.name, 'Unknown'),
      'date', NEW.date,
      'time', NEW.time_slot,
      'location', NEW.location,
      'action_url', '/coach/bookings/' || NEW.id
    ),
    'high'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new bookings
DROP TRIGGER IF EXISTS trigger_notify_new_booking ON bookings;
CREATE TRIGGER trigger_notify_new_booking
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_booking();

-- Create function to clean up old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  -- Delete read notifications older than 30 days
  DELETE FROM notifications
  WHERE read_at IS NOT NULL
    AND created_at < NOW() - INTERVAL '30 days';

  -- Delete expired notifications
  DELETE FROM notifications
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW();

  -- Archive unread notifications older than 90 days
  UPDATE notifications
  SET archived_at = NOW()
  WHERE read_at IS NULL
    AND archived_at IS NULL
    AND created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read, archive)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- System can insert notifications for any user (via triggers)
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);