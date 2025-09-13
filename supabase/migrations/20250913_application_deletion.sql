-- ===================================
-- APPLICATION DELETION POLICY FIX
-- ===================================
-- Allows coaches to delete/withdraw their own applications

-- Add DELETE policy for coaches to withdraw their own applications
CREATE POLICY "Coaches can delete their own applications"
  ON public.applications
  FOR DELETE
  USING (
    auth.uid() = coach_id
    -- Only allow deletion of pending applications
    -- Accepted/rejected applications should remain for record keeping
    AND status = 'pending'
  );

-- Alternative: If you want coaches to delete ANY of their applications regardless of status
-- Uncomment the following and comment out the above policy:
/*
CREATE POLICY "Coaches can delete their own applications"
  ON public.applications
  FOR DELETE
  USING (auth.uid() = coach_id);
*/

-- Grant delete permission to authenticated users (required for RLS)
GRANT DELETE ON public.applications TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Application deletion policy added successfully!';
END $$;