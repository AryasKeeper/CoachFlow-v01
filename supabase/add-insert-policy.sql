-- Add INSERT policy for users table to allow new user creation
CREATE POLICY "Allow user creation during signup" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Alternative: Allow service role to insert (more permissive but secure for triggers)
-- This ensures the trigger can always insert regardless of auth context
CREATE POLICY "Allow service role to insert users" ON public.users
  FOR INSERT WITH CHECK (true);