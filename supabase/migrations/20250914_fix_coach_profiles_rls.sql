-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Coaches can view own profile" ON coach_profiles;
DROP POLICY IF EXISTS "Coaches can update own profile" ON coach_profiles;
DROP POLICY IF EXISTS "Coaches can insert own profile" ON coach_profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON coach_profiles;

-- Enable RLS on coach_profiles table
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;

-- Allow coaches to view their own profile
CREATE POLICY "Coaches can view own profile" ON coach_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow coaches to insert their own profile
CREATE POLICY "Coaches can insert own profile" ON coach_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow coaches to update their own profile
CREATE POLICY "Coaches can update own profile" ON coach_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow anyone to view coach profiles (for public listing pages)
CREATE POLICY "Public profiles are viewable by everyone" ON coach_profiles
  FOR SELECT
  USING (true);

-- Also ensure the storage policies are correct (fixing the folder name extraction)
DROP POLICY IF EXISTS "Authenticated users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Simpler storage policies that work with the file path structure
CREATE POLICY "Authenticated users can upload avatar" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'profiles'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update avatar" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'profiles'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete avatar" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'profiles'
    AND auth.role() = 'authenticated'
  );