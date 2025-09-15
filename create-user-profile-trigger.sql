-- Create a trigger to automatically create appUsers profile when new user signs up
-- This solves the "Database error loading user after sign-up" issue

-- Step 1: Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert new user profile into appUsers table
  INSERT INTO public."appUsers" (
    id,
    human_id,
    name,
    email,
    primary_role,
    status,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    'JKDP-USR-' || LPAD((
      SELECT COALESCE(MAX(CAST(SUBSTRING(human_id FROM 10) AS INTEGER)), 0) + 1
      FROM public."appUsers"
      WHERE human_id LIKE 'JKDP-USR-%'
    )::text, 3, '0'),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    'customer', -- Default role for new signups
    'active',
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Enable RLS and create policies (if not already done)
ALTER TABLE public."appUsers" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own profile" ON public."appUsers";
DROP POLICY IF EXISTS "Users can update own profile" ON public."appUsers";
DROP POLICY IF EXISTS "Allow insert for new users" ON public."appUsers";
DROP POLICY IF EXISTS "Allow authenticated read access" ON public."appUsers";

-- Create new comprehensive policies
CREATE POLICY "Allow authenticated read access" ON public."appUsers"
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can read own profile" ON public."appUsers"
    FOR SELECT USING (auth.uid() = id::uuid);

CREATE POLICY "Users can update own profile" ON public."appUsers"
    FOR UPDATE USING (auth.uid() = id::uuid);

CREATE POLICY "Allow system to insert new users" ON public."appUsers"
    FOR INSERT WITH CHECK (true); -- Allow the trigger to insert

-- Step 4: Create the lowercase view for case sensitivity issues
CREATE OR REPLACE VIEW public.appusers AS SELECT * FROM public."appUsers";

-- Test the setup
SELECT 'User profile creation trigger installed successfully!' as status;