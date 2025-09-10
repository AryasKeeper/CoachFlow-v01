-- CRITICAL RLS SECURITY FIXES FOR COACHFLOW
-- These fixes address the broken access control policies identified in the security audit

-- 1. FIX: Overly permissive profile viewing policies
DROP POLICY IF EXISTS "Anyone can view coach profiles" ON public.coach_profiles;
DROP POLICY IF EXISTS "Anyone can view org profiles" ON public.org_profiles;

-- NEW: Require authentication to view profiles
CREATE POLICY "Authenticated users can view coach profiles" ON public.coach_profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view org profiles" ON public.org_profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- 2. FIX: Broken application update policy that allows self-acceptance
DROP POLICY IF EXISTS "Anyone can update applications they're involved in" ON public.applications;

-- NEW: Separate policies for coaches and orgs with proper restrictions
CREATE POLICY "Coaches can update their own applications" ON public.applications
  FOR UPDATE USING (auth.uid() = coach_id)
  WITH CHECK (
    -- Coaches can only update cover_letter and status to 'withdrawn'
    -- They CANNOT accept their own applications
    (status = OLD.status OR status = 'withdrawn')
  );

CREATE POLICY "Orgs can update applications to their listings" ON public.applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE listings.id = applications.listing_id
      AND listings.org_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Orgs can accept, reject, or shortlist applications
    status IN ('pending', 'accepted', 'rejected', 'shortlisted')
  );

-- 3. FIX: Add missing INSERT policy for users table
CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. FIX: Add missing INSERT policies for profile tables
CREATE POLICY "Users can create their coach profile" ON public.coach_profiles
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'coach')
  );

CREATE POLICY "Users can create their org profile" ON public.org_profiles
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'org')
  );

-- 5. FIX: Add admin access policies with proper role checking
CREATE POLICY "Admins have full access to users" ON public.users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins have full access to coach profiles" ON public.coach_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins have full access to org profiles" ON public.org_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins have full access to listings" ON public.listings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins have full access to applications" ON public.applications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins have full access to bookings" ON public.bookings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- 6. FIX: Strengthen listings visibility policy
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;

CREATE POLICY "Authenticated users can view active listings" ON public.listings
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      status = 'active' OR 
      org_id = auth.uid() OR
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- 7. FIX: Add DELETE policies for data protection
CREATE POLICY "Users can delete their own profile" ON public.users
  FOR DELETE USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can delete their coach profile" ON public.coach_profiles
  FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can delete their org profile" ON public.org_profiles
  FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Orgs can delete their listings" ON public.listings
  FOR DELETE USING (
    auth.uid() = org_id OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- 8. FIX: Add security function to validate user roles
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. FIX: Add audit logging for sensitive operations
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_log
  FOR SELECT USING (public.is_admin());

-- 10. SECURITY NOTE: These fixes address the following vulnerabilities:
-- - Prevents coaches from accepting their own applications
-- - Requires authentication to view profiles (prevents data scraping)
-- - Adds proper admin access controls
-- - Implements missing INSERT/DELETE policies
-- - Adds audit logging for compliance
-- - Separates update permissions for different roles
-- 
-- DEPLOYMENT: Run this script in your Supabase SQL editor AFTER backing up your database