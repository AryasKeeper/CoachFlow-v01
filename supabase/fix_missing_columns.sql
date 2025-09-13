-- Fix missing gender columns in database
-- This adds the missing gender_preference column to listings and gender column to coach_profiles

-- Add gender_preference to listings table if it doesn't exist
DO $$ 
BEGIN
    -- Check if gender_preference column exists, if not add it
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='listings' 
        AND column_name='gender_preference'
        AND table_schema='public'
    ) THEN
        ALTER TABLE public.listings 
        ADD COLUMN gender_preference TEXT CHECK (gender_preference IN ('male', 'female', 'non-binary', 'no-preference')) DEFAULT 'no-preference';
        
        -- Update existing records to have default value
        UPDATE public.listings 
        SET gender_preference = 'no-preference' 
        WHERE gender_preference IS NULL;
        
        -- Create index for efficient filtering
        CREATE INDEX IF NOT EXISTS idx_listings_gender_preference ON public.listings(gender_preference);
        
        -- Add comment
        COMMENT ON COLUMN public.listings.gender_preference IS 
        'Optional gender preference for coach selection. Values: male, female, non-binary, no-preference (default). When set to no-preference, listing shows to all coaches regardless of gender.';
        
        RAISE NOTICE 'Added gender_preference column to listings table';
    ELSE
        RAISE NOTICE 'gender_preference column already exists in listings table';
    END IF;
END $$;

-- Add gender to coach_profiles table if it doesn't exist
DO $$ 
BEGIN
    -- Check if gender column exists, if not add it
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='coach_profiles' 
        AND column_name='gender'
        AND table_schema='public'
    ) THEN
        ALTER TABLE public.coach_profiles 
        ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female', 'non-binary', 'prefer-not-to-say'));
        
        -- Create index for efficient filtering
        CREATE INDEX IF NOT EXISTS idx_coach_profiles_gender ON public.coach_profiles(gender);
        
        -- Add comment
        COMMENT ON COLUMN public.coach_profiles.gender IS 
        'Coach gender for matching with organization preferences. Values: male, female, non-binary, prefer-not-to-say. Required for matching algorithm.';
        
        RAISE NOTICE 'Added gender column to coach_profiles table';
    ELSE
        RAISE NOTICE 'gender column already exists in coach_profiles table';
    END IF;
END $$;