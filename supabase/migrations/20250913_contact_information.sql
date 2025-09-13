-- ===================================
-- CONTACT INFORMATION SYSTEM
-- ===================================
-- Replaces messaging with direct contact details handoff

-- Add contact information fields to coach_profiles
ALTER TABLE public.coach_profiles
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'both')),
ADD COLUMN IF NOT EXISTS contact_availability TEXT, -- e.g., "Weekdays 9am-5pm"
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS years_experience INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS specializations TEXT[], -- Array of sports/specializations
ADD COLUMN IF NOT EXISTS certifications TEXT[], -- Array of certifications
ADD COLUMN IF NOT EXISTS travel_radius INTEGER DEFAULT 25, -- Miles willing to travel
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS coaching_philosophy TEXT,
ADD COLUMN IF NOT EXISTS achievements TEXT;

-- Add contact information fields to org_profiles
ALTER TABLE public.org_profiles
ADD COLUMN IF NOT EXISTS contact_person_name TEXT,
ADD COLUMN IF NOT EXISTS contact_person_title TEXT, -- e.g., "Sports Director", "HR Manager"
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS about_organization TEXT,
ADD COLUMN IF NOT EXISTS facility_photos TEXT[], -- Array of photo URLs
ADD COLUMN IF NOT EXISTS team_culture TEXT,
ADD COLUMN IF NOT EXISTS coaching_staff_size INTEGER,
ADD COLUMN IF NOT EXISTS program_details TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add contact reveal tracking to applications
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS contact_revealed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS contact_revealed_at TIMESTAMPTZ;

-- Create indexes for search functionality
CREATE INDEX IF NOT EXISTS idx_coach_profiles_specializations ON public.coach_profiles USING GIN (specializations);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_certifications ON public.coach_profiles USING GIN (certifications);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_experience ON public.coach_profiles(years_experience);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_travel ON public.coach_profiles(travel_radius);

CREATE INDEX IF NOT EXISTS idx_org_profiles_city ON public.org_profiles(city);
CREATE INDEX IF NOT EXISTS idx_org_profiles_state ON public.org_profiles(state);
CREATE INDEX IF NOT EXISTS idx_org_profiles_location ON public.org_profiles(latitude, longitude);

-- Function to reveal contact details when application is accepted
CREATE OR REPLACE FUNCTION reveal_contact_details()
RETURNS TRIGGER AS $$
BEGIN
  -- When application status changes to 'accepted', reveal contact details
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    NEW.contact_revealed = TRUE;
    NEW.contact_revealed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic contact reveal
DROP TRIGGER IF EXISTS on_application_accepted ON public.applications;
CREATE TRIGGER on_application_accepted
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION reveal_contact_details();

-- Update RLS policies for contact information

-- Coaches can view org contact details only for accepted applications
CREATE POLICY "Coaches view org contacts for accepted applications"
  ON public.org_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.listings l ON l.id = a.listing_id
      WHERE a.coach_id = auth.uid()
      AND l.org_id = org_profiles.user_id
      AND a.status = 'accepted'
      AND a.contact_revealed = TRUE
    )
    OR
    -- Or if viewing public profile information (non-contact fields)
    auth.uid() IS NOT NULL
  );

-- Organizations can view coach contact details for accepted applications
CREATE POLICY "Orgs view coach contacts for accepted applications"
  ON public.coach_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.listings l ON l.id = a.listing_id
      WHERE l.org_id = auth.uid()
      AND a.coach_id = coach_profiles.user_id
      AND a.status = 'accepted'
      AND a.contact_revealed = TRUE
    )
    OR
    -- Or if viewing public profile information (non-contact fields)
    auth.uid() IS NOT NULL
  );

-- Grant permissions
GRANT SELECT ON public.coach_profiles TO authenticated;
GRANT SELECT ON public.org_profiles TO authenticated;
GRANT UPDATE (contact_revealed, contact_revealed_at) ON public.applications TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Contact information system setup completed successfully!';
  RAISE NOTICE 'Contact details will be automatically revealed when applications are accepted.';
END $$;