-- Comprehensive fix for all missing columns
-- This ensures the database matches the application schema expectations

-- Add suburbs column to listings
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS suburbs TEXT[] NOT NULL DEFAULT '{}';

-- Add other potentially missing columns to listings
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS dates JSONB;

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS time_intervals JSONB;

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS pay_min NUMERIC(10,2);

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS pay_max NUMERIC(10,2);

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS required_badges TEXT[] DEFAULT '{}';

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS urgency TEXT CHECK (urgency IN ('urgent', 'soon', 'flexible'));

-- Create all necessary indexes
CREATE INDEX IF NOT EXISTS idx_listings_suburbs ON public.listings USING GIN(suburbs);

-- Add comments for documentation
COMMENT ON COLUMN public.listings.suburbs IS 'Array of suburb names where the coaching service is available or requested';
COMMENT ON COLUMN public.listings.dates IS 'JSON object containing available dates for the coaching service';
COMMENT ON COLUMN public.listings.time_intervals IS 'JSON object containing available time slots';
COMMENT ON COLUMN public.listings.required_badges IS 'Array of required certifications or badges for coaches';