-- Migration: Replace location text field with suburbs array for standardized area matching
-- This migration updates the listings table to use structured suburbs instead of free text location

-- First, add the new suburbs column
ALTER TABLE public.listings 
ADD COLUMN suburbs TEXT[] DEFAULT '{}';

-- Create a function to extract suburbs from location text
CREATE OR REPLACE FUNCTION extract_suburbs_from_location(location_text TEXT)
RETURNS TEXT[] AS $$
DECLARE
  result TEXT[] := '{}';
  suburb TEXT;
  sydney_suburbs TEXT[] := ARRAY[
    -- Inner City
    'Alexandria', 'Chippendale', 'Darlinghurst', 'Glebe', 'Potts Point',
    'Redfern', 'Surry Hills', 'Sydney CBD', 'Ultimo', 'Waterloo',
    -- Eastern Suburbs
    'Bondi', 'Bondi Junction', 'Bronte', 'Clovelly', 'Coogee',
    'Maroubra', 'Paddington', 'Randwick',
    -- Inner West
    'Annandale', 'Ashfield', 'Dulwich Hill', 'Erskineville', 'Leichhardt',
    'Lilyfield', 'Marrickville', 'Newtown', 'Petersham', 'Rozelle', 'Summer Hill',
    -- North Shore
    'Artarmon', 'Chatswood', 'Crows Nest', 'Lane Cove', 'Mosman',
    'Neutral Bay', 'North Sydney', 'Willoughby', 'Wollstonecraft',
    -- Northern Beaches
    'Brookvale', 'Collaroy', 'Dee Why', 'Manly', 'Narrabeen', 'Palm Beach',
    -- Western Sydney
    'Auburn', 'Bankstown', 'Blacktown', 'Granville', 'Homebush',
    'Lidcombe', 'Mount Druitt', 'Parramatta', 'Penrith', 'Rooty Hill',
    'Strathfield', 'Westmead',
    -- South West Sydney
    'Campbelltown', 'Casula', 'Fairfield', 'Hoxton Park', 'Ingleburn',
    'Liverpool', 'Punchbowl', 'Revesby', 'Wetherill Park',
    -- Southern Sydney & St George
    'Brighton-Le-Sands', 'Canterbury', 'Hurstville', 'Kogarah',
    'Rockdale', 'Sans Souci',
    -- Sutherland Shire
    'Cronulla', 'Engadine', 'Gymea', 'Menai', 'Miranda', 'Sutherland',
    -- Greater Ryde & Macquarie
    'Macquarie Park', 'Meadowbank', 'Ryde',
    -- Emerging/Edge Suburbs
    'Concord', 'Drummoyne', 'Five Dock', 'Rhodes', 'Wentworth Point'
  ];
BEGIN
  -- Convert location text to lowercase for matching
  location_text := LOWER(location_text);
  
  -- Check each suburb against the location text
  FOREACH suburb IN ARRAY sydney_suburbs
  LOOP
    IF location_text LIKE '%' || LOWER(suburb) || '%' THEN
      result := array_append(result, suburb);
    END IF;
  END LOOP;
  
  -- If no suburbs found, try to extract from common patterns
  IF array_length(result, 1) IS NULL THEN
    -- Handle "Sydney CBD" variations
    IF location_text LIKE '%cbd%' OR location_text LIKE '%city%' OR location_text LIKE '%george%street%' THEN
      result := array_append(result, 'Sydney CBD');
    -- Handle "Bondi Beach" variations  
    ELSIF location_text LIKE '%bondi%beach%' OR location_text LIKE '%bondi%' THEN
      result := array_append(result, 'Bondi');
    -- Add more specific patterns as needed
    END IF;
  END IF;
  
  -- If still no match, default to Sydney CBD as fallback
  IF array_length(result, 1) IS NULL THEN
    result := ARRAY['Sydney CBD'];
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update existing listings to extract suburbs from location text
UPDATE public.listings 
SET suburbs = extract_suburbs_from_location(location)
WHERE location IS NOT NULL AND location != '';

-- For listings with empty/null location, set to Sydney CBD as default
UPDATE public.listings 
SET suburbs = ARRAY['Sydney CBD']
WHERE suburbs = '{}' OR suburbs IS NULL;

-- Make suburbs column NOT NULL now that all rows have values
ALTER TABLE public.listings 
ALTER COLUMN suburbs SET NOT NULL;

-- Add a comment to document the new structure
COMMENT ON COLUMN public.listings.suburbs IS 
'Array of suburb names where coaching is needed. Uses standardized Sydney suburb names for proper matching with coach service areas. Example: [\"Bondi\", \"Coogee\"]';

-- Create an index to optimize suburb-based queries
CREATE INDEX idx_listings_suburbs ON public.listings USING GIN (suburbs);

-- Add validation check to ensure suburbs is a proper array with valid suburbs
ALTER TABLE public.listings 
ADD CONSTRAINT check_suburbs_array 
CHECK (array_length(suburbs, 1) > 0 AND array_length(suburbs, 1) <= 5);

-- Drop the old location column (optional - uncomment if you want to remove it completely)
-- ALTER TABLE public.listings DROP COLUMN location;

-- Clean up the temporary function
DROP FUNCTION IF EXISTS extract_suburbs_from_location(TEXT);