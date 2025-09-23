-- Populate primary location data for existing coach profiles
-- This sets default locations in Sydney for demo accounts

-- Update coach profiles with Sydney locations for testing
-- You can run this in Supabase SQL Editor to populate existing coaches

UPDATE public.coach_profiles
SET
  primary_suburb = CASE
    WHEN user_id = (SELECT id FROM auth.users WHERE email = 'coach@example.com' LIMIT 1) THEN 'Bondi Beach'
    WHEN user_id = (SELECT id FROM auth.users WHERE email = 'coach2@example.com' LIMIT 1) THEN 'Manly'
    ELSE COALESCE(suburbs[1], 'Sydney CBD')  -- Use first suburb from suburbs array if available
  END,
  primary_suburb_lat = CASE
    WHEN user_id = (SELECT id FROM auth.users WHERE email = 'coach@example.com' LIMIT 1) THEN -33.8915
    WHEN user_id = (SELECT id FROM auth.users WHERE email = 'coach2@example.com' LIMIT 1) THEN -33.7969
    ELSE -33.8688  -- Sydney CBD
  END,
  primary_suburb_lng = CASE
    WHEN user_id = (SELECT id FROM auth.users WHERE email = 'coach@example.com' LIMIT 1) THEN 151.2767
    WHEN user_id = (SELECT id FROM auth.users WHERE email = 'coach2@example.com' LIMIT 1) THEN 151.2851
    ELSE 151.2093  -- Sydney CBD
  END,
  service_radius_km = CASE
    WHEN user_id = (SELECT id FROM auth.users WHERE email = 'coach@example.com' LIMIT 1) THEN 15
    WHEN user_id = (SELECT id FROM auth.users WHERE email = 'coach2@example.com' LIMIT 1) THEN 25
    ELSE 20  -- Default 20km radius
  END
WHERE primary_suburb IS NULL;

-- Alternative: Update all coach profiles that have suburbs array but no primary location
UPDATE public.coach_profiles
SET
  primary_suburb = suburbs[1],
  primary_suburb_lat = -33.8688,  -- Default to Sydney CBD coordinates
  primary_suburb_lng = 151.2093,   -- You'd want to use a geocoding service for real coordinates
  service_radius_km = 20
WHERE primary_suburb IS NULL
  AND suburbs IS NOT NULL
  AND array_length(suburbs, 1) > 0;