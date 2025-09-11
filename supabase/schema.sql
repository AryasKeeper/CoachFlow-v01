-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('coach', 'org', 'admin');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL,
  name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coach profiles
CREATE TABLE public.coach_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  bio TEXT,
  specialties TEXT[] DEFAULT '{}',
  suburbs TEXT[] DEFAULT '{}',
  rate_hourly NUMERIC(10,2),
  rate_flat NUMERIC(10,2),
  travel_km INTEGER,
  wwcc_number TEXT,
  wwcc_expiry DATE,
  insurance_url TEXT,
  first_aid_url TEXT,
  abn TEXT,
  rating_avg NUMERIC(3,2),
  rating_count INTEGER DEFAULT 0,
  availability JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization profiles
CREATE TABLE public.org_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  org_name TEXT NOT NULL,
  org_type TEXT,
  suburbs TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listings
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  suburbs TEXT[] NOT NULL DEFAULT '{}',
  dates JSONB NOT NULL,
  time_intervals JSONB NOT NULL,
  pay_min NUMERIC(10,2),
  pay_max NUMERIC(10,2),
  required_badges TEXT[] DEFAULT '{}',
  urgency TEXT CHECK (urgency IN ('urgent', 'soon', 'flexible')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applications
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT,
  proposed_rate NUMERIC(10,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id, coach_id)
);

-- Bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  rate NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'rated')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions (for future use)
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL,
  subject_role TEXT NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'business')),
  reachouts_used INTEGER DEFAULT 0,
  reachouts_limit INTEGER,
  active_listings_limit INTEGER,
  renews_at DATE
);

-- Create indexes for better performance
CREATE INDEX idx_coach_profiles_suburbs ON public.coach_profiles USING GIN(suburbs);
CREATE INDEX idx_org_profiles_suburbs ON public.org_profiles USING GIN(suburbs);
CREATE INDEX idx_listings_org_id ON public.listings(org_id);
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_listings_suburbs ON public.listings USING GIN (suburbs);
CREATE INDEX idx_applications_listing_id ON public.applications(listing_id);
CREATE INDEX idx_applications_coach_id ON public.applications(coach_id);
CREATE INDEX idx_bookings_org_id ON public.bookings(org_id);
CREATE INDEX idx_bookings_coach_id ON public.bookings(coach_id);
CREATE INDEX idx_messages_thread_id ON public.messages(thread_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Coach profiles policies
CREATE POLICY "Anyone can view coach profiles" ON public.coach_profiles
  FOR SELECT USING (true);

CREATE POLICY "Coaches can update their own profile" ON public.coach_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Org profiles policies
CREATE POLICY "Anyone can view org profiles" ON public.org_profiles
  FOR SELECT USING (true);

CREATE POLICY "Orgs can update their own profile" ON public.org_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Listings policies
CREATE POLICY "Anyone can view active listings" ON public.listings
  FOR SELECT USING (status = 'active' OR org_id = auth.uid());

CREATE POLICY "Orgs can create listings" ON public.listings
  FOR INSERT WITH CHECK (auth.uid() = org_id);

CREATE POLICY "Orgs can update their own listings" ON public.listings
  FOR UPDATE USING (auth.uid() = org_id);

-- Applications policies
CREATE POLICY "Coaches can view their own applications" ON public.applications
  FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Orgs can view applications to their listings" ON public.applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE listings.id = applications.listing_id
      AND listings.org_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can create applications" ON public.applications
  FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Anyone can update applications they're involved in" ON public.applications
  FOR UPDATE USING (
    auth.uid() = coach_id OR
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE listings.id = applications.listing_id
      AND listings.org_id = auth.uid()
    )
  );

-- Bookings policies
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = org_id OR auth.uid() = coach_id);

CREATE POLICY "Orgs can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = org_id);

CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = org_id OR auth.uid() = coach_id);

-- Messages policies
CREATE POLICY "Users can view messages in their threads" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = messages.thread_id::uuid
      AND (bookings.org_id = auth.uid() OR bookings.coach_id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE listings.id = messages.thread_id::uuid
      AND listings.org_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.listing_id = messages.thread_id::uuid
      AND applications.coach_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in their threads" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Subscriptions policies
CREATE POLICY "Users can view their own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = subject_id::uuid);

-- Functions and Triggers

-- Function to automatically create user record after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'coach'::user_role
    ),
    NEW.raw_user_meta_data->>'name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update listing counts
CREATE OR REPLACE FUNCTION public.update_application_count()
RETURNS TRIGGER AS $$
BEGIN
  -- This would update a denormalized count if needed
  -- For now, we'll use COUNT queries
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;