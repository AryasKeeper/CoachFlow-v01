-- Simple fix for missing gender columns
-- Run these statements one at a time if needed

-- Add gender_preference to listings table
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS gender_preference TEXT CHECK (gender_preference IN ('male', 'female', 'non-binary', 'no-preference')) DEFAULT 'no-preference';

-- Update existing records to have default value
UPDATE public.listings 
SET gender_preference = 'no-preference' 
WHERE gender_preference IS NULL;

-- Add gender to coach_profiles table  
ALTER TABLE public.coach_profiles 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'non-binary', 'prefer-not-to-say'));

-- Create indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_listings_gender_preference ON public.listings(gender_preference);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_gender ON public.coach_profiles(gender);

-- Add helpful comments
COMMENT ON COLUMN public.listings.gender_preference IS 'Optional gender preference for coach selection. Values: male, female, non-binary, no-preference (default)';
COMMENT ON COLUMN public.coach_profiles.gender IS 'Coach gender for matching with organization preferences. Values: male, female, non-binary, prefer-not-to-say';