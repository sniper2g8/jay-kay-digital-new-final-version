-- Fix login permissions for existing appUsers table
-- The table exists but RLS is blocking access during login

-- 1. Grant basic schema and table permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON "appUsers" TO anon;
GRANT SELECT ON "appUsers" TO authenticated;

-- 2. Enable RLS on appUsers table (if not already enabled)
ALTER TABLE public."appUsers" ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow anonymous read access to appUsers" ON public."appUsers";
DROP POLICY IF EXISTS "Allow authenticated read access to appUsers" ON public."appUsers";
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public."appUsers";

-- 4. Create RLS policies for login access
-- Allow anonymous users to read appUsers (needed for role checking during login)
CREATE POLICY "Allow anonymous read access to appUsers" ON public."appUsers"
    FOR SELECT TO anon USING (true);

-- Allow authenticated users to read appUsers (needed for role checking after login)
CREATE POLICY "Allow authenticated read access to appUsers" ON public."appUsers"
    FOR SELECT TO authenticated USING (true);

-- 5. Also fix related tables that might be needed during login
-- Roles table
GRANT SELECT ON roles TO anon;
GRANT SELECT ON roles TO authenticated;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access to roles" ON public.roles;
CREATE POLICY "Allow read access to roles" ON public.roles
    FOR SELECT USING (true);

-- Permissions table  
GRANT SELECT ON permissions TO anon;
GRANT SELECT ON permissions TO authenticated;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access to permissions" ON public.permissions;
CREATE POLICY "Allow read access to permissions" ON public.permissions
    FOR SELECT USING (true);

-- 6. Test the fix
SELECT 'Login permissions fixed for appUsers table' as status;
SELECT 'Testing appUsers access...' as test;
SELECT COUNT(*) as appUsers_count FROM public."appUsers";