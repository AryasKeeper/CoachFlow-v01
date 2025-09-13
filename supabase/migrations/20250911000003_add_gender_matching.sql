-- Migration: Add gender-aware matching system for coach listings
-- This migration adds gender fields to enable respectful and inclusive coach-organization matching

-- Add gender field to coach profiles (required for matching)
ALTER TABLE public.coach_profiles 
ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female', 'non-binary', 'prefer-not-to-say'));

-- Add gender preference to listings (optional for organizations)
ALTER TABLE public.listings 
ADD COLUMN gender_preference TEXT CHECK (gender_preference IN ('male', 'female', 'non-binary', 'no-preference'));

-- Set default values for existing data
UPDATE public.listings 
SET gender_preference = 'no-preference' 
WHERE gender_preference IS NULL;

-- Add comments to document the gender matching system
COMMENT ON COLUMN public.coach_profiles.gender IS 
'Coach gender for matching with organization preferences. Values: male, female, non-binary, prefer-not-to-say. Required for matching algorithm.';

COMMENT ON COLUMN public.listings.gender_preference IS 
'Optional gender preference for coach selection. Values: male, female, non-binary, no-preference (default). When set to no-preference, listing shows to all coaches regardless of gender.';

-- Create index for efficient gender-based filtering
CREATE INDEX idx_coach_profiles_gender ON public.coach_profiles(gender);
CREATE INDEX idx_listings_gender_preference ON public.listings(gender_preference);

-- Add validation to ensure respectful gender matching
-- This ensures that if gender_preference is specified, it must match available coach genders
-- The application layer will handle the inclusive filtering logic