-- Add primary location fields to coach_profiles
-- This allows coaches to have a primary base location plus service areas

-- Add primary_suburb column to coach_profiles
ALTER TABLE public.coach_profiles
ADD COLUMN IF NOT EXISTS primary_suburb TEXT;

-- Add primary_suburb_lat and primary_suburb_lng for map plotting
ALTER TABLE public.coach_profiles
ADD COLUMN IF NOT EXISTS primary_suburb_lat DECIMAL(10, 8);

ALTER TABLE public.coach_profiles
ADD COLUMN IF NOT EXISTS primary_suburb_lng DECIMAL(11, 8);

-- Add service_radius_km to indicate how far they're willing to travel from primary location
ALTER TABLE public.coach_profiles
ADD COLUMN IF NOT EXISTS service_radius_km INTEGER DEFAULT 20;

-- Add comment to clarify the fields
COMMENT ON COLUMN public.coach_profiles.primary_suburb IS 'The primary location where the coach is based';
COMMENT ON COLUMN public.coach_profiles.primary_suburb_lat IS 'Latitude of the primary suburb for map plotting';
COMMENT ON COLUMN public.coach_profiles.primary_suburb_lng IS 'Longitude of the primary suburb for map plotting';
COMMENT ON COLUMN public.coach_profiles.service_radius_km IS 'How far the coach is willing to travel from their primary location in kilometers';
COMMENT ON COLUMN public.coach_profiles.suburbs IS 'Additional areas where the coach is willing to provide services';

-- For organizations, add lat/lng for their addresses for better map plotting
ALTER TABLE public.org_profiles
ADD COLUMN IF NOT EXISTS address_lat DECIMAL(10, 8);

ALTER TABLE public.org_profiles
ADD COLUMN IF NOT EXISTS address_lng DECIMAL(11, 8);

-- Also add lat/lng to listings for precise location plotting
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10, 8);

ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11, 8);