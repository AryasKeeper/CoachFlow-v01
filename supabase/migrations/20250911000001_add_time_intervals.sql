-- Migration: Replace timeslots with time_intervals
-- This migration updates the listings table to use precise time intervals instead of simple time slots

-- First, let's add the new time_intervals column
ALTER TABLE public.listings 
ADD COLUMN time_intervals JSONB;

-- Copy existing timeslots data to time_intervals with a transformation
-- For existing data, we'll convert simple times to intervals (assuming 1-hour durations)
UPDATE public.listings 
SET time_intervals = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', slot || '-' || extract(epoch from now())::text,
      'startTime', slot,
      'endTime', (
        CASE 
          WHEN slot ~ '^\d{2}:\d{2}$' THEN 
            to_char((slot::time + interval '1 hour'), 'HH24:MI')
          ELSE 
            slot  -- fallback for malformed data
        END
      )
    )
  )
  FROM jsonb_array_elements_text(timeslots) AS slot
)
WHERE timeslots IS NOT NULL AND jsonb_array_length(timeslots) > 0;

-- For listings without timeslots, set to empty array
UPDATE public.listings 
SET time_intervals = '[]'::jsonb 
WHERE time_intervals IS NULL;

-- Make time_intervals NOT NULL now that all rows have values
ALTER TABLE public.listings 
ALTER COLUMN time_intervals SET NOT NULL;

-- Drop the old timeslots column
ALTER TABLE public.listings 
DROP COLUMN timeslots;

-- Add a comment to document the new structure
COMMENT ON COLUMN public.listings.time_intervals IS 
'Array of time interval objects with id, startTime (HH:MM), and endTime (HH:MM) properties. Example: [{"id": "unique-id", "startTime": "09:30", "endTime": "10:30"}]';

-- Create an index to optimize queries on time intervals
CREATE INDEX idx_listings_time_intervals ON public.listings USING GIN (time_intervals);

-- Add validation check to ensure time_intervals is a proper array
ALTER TABLE public.listings 
ADD CONSTRAINT check_time_intervals_array 
CHECK (jsonb_typeof(time_intervals) = 'array');