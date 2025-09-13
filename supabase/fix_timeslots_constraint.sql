-- Fix timeslots NOT NULL constraint issue
-- This allows creating new listings while we sort out the migration from timeslots to time_intervals

-- Remove NOT NULL constraint from timeslots column
ALTER TABLE public.listings 
ALTER COLUMN timeslots DROP NOT NULL;

-- Set default value for existing rows
UPDATE public.listings 
SET timeslots = '[]'::jsonb 
WHERE timeslots IS NULL;

-- Add comment explaining the situation
COMMENT ON COLUMN public.listings.timeslots IS 
'Legacy timeslots column - being migrated to time_intervals. Currently nullable to prevent constraint violations.';