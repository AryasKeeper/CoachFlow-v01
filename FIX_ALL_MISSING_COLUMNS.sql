-- ============================================
-- COMPREHENSIVE FIX FOR ALL MISSING COLUMNS
-- ============================================
-- Run this SQL in your Supabase Dashboard -> SQL Editor
-- This will add ALL missing columns to the coach_profiles table

-- First, let's check what columns already exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'coach_profiles'
ORDER BY column_name;

-- Add all potentially missing columns from the migrations
-- Each column uses IF NOT EXISTS so it won't error if already present

ALTER TABLE public.coach_profiles
-- Contact Information columns (from 20250913_contact_information.sql)
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'both')),
ADD COLUMN IF NOT EXISTS contact_availability TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS years_experience INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS specializations TEXT[],
ADD COLUMN IF NOT EXISTS certifications TEXT[],
ADD COLUMN IF NOT EXISTS travel_radius INTEGER DEFAULT 25,
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS coaching_philosophy TEXT,
ADD COLUMN IF NOT EXISTS achievements TEXT,

-- Gender field (from 20250911000003_add_gender_matching.sql)
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'non-binary', 'prefer-not-to-say')),

-- Basic profile fields that should exist but might be missing
ADD COLUMN IF NOT EXISTS abn TEXT,
ADD COLUMN IF NOT EXISTS rate_hourly DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS rate_flat DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS travel_km INTEGER,
ADD COLUMN IF NOT EXISTS specialties TEXT[],
ADD COLUMN IF NOT EXISTS suburbs TEXT[],

-- Verification fields (should already exist but checking)
ADD COLUMN IF NOT EXISTS wwcc_number TEXT,
ADD COLUMN IF NOT EXISTS wwcc_expiry DATE,
ADD COLUMN IF NOT EXISTS insurance_url TEXT,
ADD COLUMN IF NOT EXISTS first_aid_url TEXT,

-- Rating fields (should already exist but checking)
ADD COLUMN IF NOT EXISTS rating_avg DECIMAL(3, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coach_profiles_specializations ON public.coach_profiles USING GIN (specializations);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_certifications ON public.coach_profiles USING GIN (certifications);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_experience ON public.coach_profiles(years_experience);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_travel ON public.coach_profiles(travel_radius);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_suburbs ON public.coach_profiles USING GIN (suburbs);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_specialties ON public.coach_profiles USING GIN (specialties);

-- Verify all columns were added successfully
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'coach_profiles'
ORDER BY column_name;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '=================================';
  RAISE NOTICE 'All missing columns have been added successfully!';
  RAISE NOTICE 'The coach_profiles table is now complete.';
  RAISE NOTICE '=================================';
END $$;