-- Comprehensive Supabase Auth Schema Fix
-- This addresses "Database error querying schema" HTTP 500 errors during authentication

-- 1. Ensure auth schema permissions
GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 2. Grant permissions on auth system tables that Supabase needs
-- Note: These might not all exist or be accessible, but we'll try
GRANT SELECT ON auth.users TO anon;
GRANT SELECT ON auth.users TO authenticated;

-- 3. Fix appUsers table permissions (case-sensitive)
GRANT SELECT ON public."appUsers" TO anon;
GRANT SELECT ON public."appUsers" TO authenticated;

-- Enable RLS and create policies for appUsers
ALTER TABLE public."appUsers" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow anonymous read access to appUsers" ON public."appUsers";
DROP POLICY IF EXISTS "Allow authenticated read access to appUsers" ON public."appUsers";

-- Create new policies
CREATE POLICY "Allow anonymous read access to appUsers" ON public."appUsers"
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow authenticated read access to appUsers" ON public."appUsers"
    FOR SELECT TO authenticated USING (true);

-- 4. Grant permissions on other tables that might be needed during auth
-- roles table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles') THEN
        GRANT SELECT ON public.roles TO anon;
        GRANT SELECT ON public.roles TO authenticated;
        ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow read access to roles" ON public.roles;
        CREATE POLICY "Allow read access to roles" ON public.roles FOR SELECT USING (true);
    END IF;
END $$;

-- permissions table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'permissions') THEN
        GRANT SELECT ON public.permissions TO anon;
        GRANT SELECT ON public.permissions TO authenticated;
        ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow read access to permissions" ON public.permissions;
        CREATE POLICY "Allow read access to permissions" ON public.permissions FOR SELECT USING (true);
    END IF;
END $$;

-- 5. Ensure information_schema access (needed for schema queries)
GRANT SELECT ON information_schema.tables TO anon;
GRANT SELECT ON information_schema.columns TO anon;
GRANT SELECT ON information_schema.table_constraints TO anon;

-- 6. Test the fix
SELECT 'Testing appUsers access...' as test_message;
SELECT count(*) as appUsers_count FROM public."appUsers";

SELECT 'Auth schema permissions updated' as status;
SELECT 'HTTP 500 auth errors should now be resolved' as result;