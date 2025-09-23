-- Ensure users table has first_name and last_name columns
-- This is in case they're missing from the users table

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Optional: Sync existing data from coach_profiles to users table
-- This will populate users table with names from coach_profiles where available
UPDATE public.users u
SET
  first_name = COALESCE(u.first_name, cp.first_name),
  last_name = COALESCE(u.last_name, cp.last_name)
FROM public.coach_profiles cp
WHERE u.id = cp.user_id
  AND (u.first_name IS NULL OR u.last_name IS NULL)
  AND (cp.first_name IS NOT NULL OR cp.last_name IS NOT NULL);