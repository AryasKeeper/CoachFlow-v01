-- Add missing suburbs column to listings table
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS suburbs TEXT[] NOT NULL DEFAULT '{}';

-- Create index for efficient suburb filtering
CREATE INDEX IF NOT EXISTS idx_listings_suburbs ON public.listings USING GIN(suburbs);

-- Add helpful comment
COMMENT ON COLUMN public.listings.suburbs IS 'Array of suburb names where the coaching service is available or requested';