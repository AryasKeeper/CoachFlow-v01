-- Add first_name and last_name columns to coach_profiles table
ALTER TABLE public.coach_profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Update existing profiles to use a default name if needed (optional)
-- You can remove this UPDATE statement if you want to leave existing profiles without names
UPDATE public.coach_profiles
SET
  first_name = 'Coach',
  last_name = 'User'
WHERE first_name IS NULL AND last_name IS NULL;