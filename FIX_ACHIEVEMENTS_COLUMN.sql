-- ============================================
-- FIX FOR MISSING ACHIEVEMENTS COLUMN
-- ============================================
-- Run this SQL in your Supabase Dashboard -> SQL Editor
-- This will add the missing achievements column to the coach_profiles table

ALTER TABLE public.coach_profiles
ADD COLUMN IF NOT EXISTS achievements TEXT;

-- Verify the column was added successfully
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'coach_profiles'
AND column_name = 'achievements';

-- Expected result: should return one row with column_name = 'achievements' and data_type = 'text'