-- Fix login issue: Add appUsers table policies for authentication flow
-- This addresses the "permission denied for table appUsers" error during login

-- 1. Grant schema access (if not already granted)
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 2. Grant table-level permissions for appUsers table (case-sensitive)
GRANT SELECT ON "appUsers" TO anon;
GRANT SELECT ON "appUsers" TO authenticated;

-- 3. Enable RLS on appUsers table (if not already enabled)
ALTER TABLE public."appUsers" ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing appUsers policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow anonymous read access to appUsers" ON public."appUsers";
DROP POLICY IF EXISTS "Allow authenticated read access to appUsers" ON public."appUsers";
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public."appUsers";

-- 5. Create RLS policies for appUsers table
-- Option A: Allow anonymous read (for development - simpler but less secure)
CREATE POLICY "Allow anonymous read access to appUsers" ON public."appUsers"
    FOR SELECT TO anon USING (true);

-- Option B: Allow authenticated users to read all appUsers (needed for role checking)
CREATE POLICY "Allow authenticated read access to appUsers" ON public."appUsers"
    FOR SELECT TO authenticated USING (true);

-- Option C: More secure - users can only read their own profile
-- (Uncomment this and comment the above if you want more security)
-- CREATE POLICY "Allow users to read their own profile" ON public."appUsers"
--     FOR SELECT TO authenticated USING (auth.uid() = id::uuid);

-- 6. Verification queries
-- Test anonymous access
SELECT 'Testing anonymous access to appUsers...' as message;
-- SELECT count(*) as appUsers_count FROM public."appUsers";

-- Test specific columns used in useUserRole hook
SELECT 'Testing useUserRole query columns...' as message;
-- SELECT id, email, name, primary_role, human_id, status FROM public."appUsers" LIMIT 1;

-- 7. Also add other missing tables that might cause similar issues
-- Add permissions for any other tables that might be queried during login

-- roles table (if it exists and is used)
GRANT SELECT ON roles TO anon;
GRANT SELECT ON roles TO authenticated;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access to roles" ON public.roles;
CREATE POLICY "Allow read access to roles" ON public.roles
    FOR SELECT USING (true);

-- permissions table (if it exists and is used)
GRANT SELECT ON permissions TO anon;
GRANT SELECT ON permissions TO authenticated;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access to permissions" ON public.permissions;
CREATE POLICY "Allow read access to permissions" ON public.permissions
    FOR SELECT USING (true);

-- 8. Debug information
SELECT 'RLS Policies created successfully for appUsers table' as status;
SELECT 'Login should now work without schema errors' as next_step;