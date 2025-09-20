-- ===================================
-- ADD FACILITY FEATURES TO ORG PROFILES
-- ===================================
-- Adds missing facility_features column for organization profiles

-- Add facility_features column to org_profiles
ALTER TABLE public.org_profiles
ADD COLUMN IF NOT EXISTS facility_features TEXT[] DEFAULT '{}';

-- Create index for facility features search
CREATE INDEX IF NOT EXISTS idx_org_profiles_facility_features
ON public.org_profiles USING GIN (facility_features);

-- Add comment
COMMENT ON COLUMN public.org_profiles.facility_features IS
'Array of facility features available at the organization (e.g., Indoor Courts, Weight Room, etc.)';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Facility features column added to org_profiles successfully!';
END $$;