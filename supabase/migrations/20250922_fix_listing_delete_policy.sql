-- Fix listing delete policy to ensure orgs can delete their own listings
-- This migration ensures the delete policy exists and is properly configured

-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "Orgs can delete their listings" ON public.listings;
DROP POLICY IF EXISTS "Orgs can delete their own listings" ON public.listings;

-- Create new delete policy that allows orgs to delete their own listings
CREATE POLICY "Orgs can delete their own listings" ON public.listings
  FOR DELETE
  USING (auth.uid() = org_id);

-- Also ensure orgs can perform all operations on their own listings
DROP POLICY IF EXISTS "Orgs can manage their own listings" ON public.listings;

-- Note: We're keeping separate policies for clarity, but you could combine them
-- The existing policies should remain:
-- - "Orgs can create listings" (INSERT)
-- - "Orgs can update their own listings" (UPDATE)
-- - "Anyone can view active listings" or "Authenticated users can view active listings" (SELECT)

-- Verify the policy is working by listing all policies on listings table
-- You can run this in Supabase SQL editor to verify:
-- SELECT * FROM pg_policies WHERE tablename = 'listings';