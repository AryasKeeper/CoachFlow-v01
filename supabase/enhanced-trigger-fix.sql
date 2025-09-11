-- Enhanced trigger function that bypasses RLS explicitly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Temporarily disable RLS for this operation
  PERFORM set_config('row_security', 'off', true);
  
  INSERT INTO public.users (id, email, role, name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'coach'::user_role
    ),
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'phone'
  );
  
  -- Re-enable RLS
  PERFORM set_config('row_security', 'on', true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;