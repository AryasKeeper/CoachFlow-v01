-- Add missing columns to org_profiles table for complete profile functionality
-- This migration adds all columns needed for the org profile form

-- Add logo_url column for organization logo
ALTER TABLE public.org_profiles
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add about_organization column for org description/bio
ALTER TABLE public.org_profiles
ADD COLUMN IF NOT EXISTS about_organization TEXT;

-- Add address fields for location information
ALTER TABLE public.org_profiles
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add facility_features as an array for listing facility amenities
ALTER TABLE public.org_profiles
ADD COLUMN IF NOT EXISTS facility_features TEXT[] DEFAULT '{}';

-- Add columns for better org information
ALTER TABLE public.org_profiles
ADD COLUMN IF NOT EXISTS website_url TEXT;

ALTER TABLE public.org_profiles
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

ALTER TABLE public.org_profiles
ADD COLUMN IF NOT EXISTS team_culture TEXT;

ALTER TABLE public.org_profiles
ADD COLUMN IF NOT EXISTS program_details TEXT;

ALTER TABLE public.org_profiles
ADD COLUMN IF NOT EXISTS coaching_staff_size INTEGER DEFAULT 0;

-- Add any other potentially missing columns that exist in the form
ALTER TABLE public.org_profiles
ADD COLUMN IF NOT EXISTS city TEXT;

ALTER TABLE public.org_profiles
ADD COLUMN IF NOT EXISTS state TEXT;

ALTER TABLE public.org_profiles
ADD COLUMN IF NOT EXISTS zip_code TEXT;

ALTER TABLE public.org_profiles
ADD COLUMN IF NOT EXISTS contact_person_name TEXT;

ALTER TABLE public.org_profiles
ADD COLUMN IF NOT EXISTS contact_person_title TEXT;

ALTER TABLE public.org_profiles
ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Add a comment to the table explaining the columns
COMMENT ON TABLE public.org_profiles IS 'Organization profiles with complete contact and facility information';

-- Add comments to new columns
COMMENT ON COLUMN public.org_profiles.logo_url IS 'URL to the organization logo image';
COMMENT ON COLUMN public.org_profiles.about_organization IS 'Organization description/bio visible on public profile';
COMMENT ON COLUMN public.org_profiles.facility_features IS 'Array of facility features/amenities';
COMMENT ON COLUMN public.org_profiles.address IS 'Street address of the organization';
COMMENT ON COLUMN public.org_profiles.team_culture IS 'Description of the organization team culture';
COMMENT ON COLUMN public.org_profiles.program_details IS 'Details about the programs offered';
COMMENT ON COLUMN public.org_profiles.coaching_staff_size IS 'Number of coaches in the organization';