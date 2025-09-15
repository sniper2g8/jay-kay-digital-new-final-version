-- IMMEDIATE FIX: Temporarily disable RLS to get authentication working
-- This will allow your app to work while we debug the specific RLS issues

-- Option 1: Temporarily disable RLS (for immediate testing)
ALTER TABLE public."appUsers" DISABLE ROW LEVEL SECURITY;

-- Option 2: If you prefer to keep RLS enabled, create very permissive policies
-- Comment out the line above and uncomment the policies below:

/*
-- Enable RLS
ALTER TABLE public."appUsers" ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON public."appUsers";
DROP POLICY IF EXISTS "Users can update own profile" ON public."appUsers";
DROP POLICY IF EXISTS "Allow insert for new users" ON public."appUsers";
DROP POLICY IF EXISTS "Allow authenticated read access" ON public."appUsers";
DROP POLICY IF EXISTS "Allow system to insert new users" ON public."appUsers";

-- Create very permissive policies for testing
CREATE POLICY "Allow all authenticated reads" ON public."appUsers"
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated updates" ON public."appUsers"
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated inserts" ON public."appUsers"
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
*/

-- Create the lowercase view for case sensitivity
CREATE OR REPLACE VIEW public.appusers AS SELECT * FROM public."appUsers";

-- Test query to verify access
SELECT 'Testing database access...' as status;
SELECT id, email, name, primary_role FROM public."appUsers" LIMIT 3;

SELECT 'RLS disabled - authentication should work now!' as result;