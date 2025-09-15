-- Fix appUsers table permissions with correct case-sensitive naming
-- PostgreSQL requires quotes around camelCase table names

-- 1. Grant schema access
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 2. Grant table permissions with correct case-sensitive name
GRANT SELECT ON public."appUsers" TO anon;
GRANT SELECT ON public."appUsers" TO authenticated;

-- 3. Enable RLS if not already enabled
ALTER TABLE public."appUsers" ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow anonymous read access to appUsers" ON public."appUsers";
DROP POLICY IF EXISTS "Allow authenticated read access to appUsers" ON public."appUsers";

-- 5. Create new RLS policies
-- Allow anonymous users to read appUsers (needed for initial auth checks)
CREATE POLICY "Allow anonymous read access to appUsers" ON public."appUsers"
    FOR SELECT TO anon USING (true);

-- Allow authenticated users to read appUsers (needed for role verification)
CREATE POLICY "Allow authenticated read access to appUsers" ON public."appUsers"
    FOR SELECT TO authenticated USING (true);

-- 6. Test queries (uncomment to verify)
-- SELECT 'Testing appUsers access...' as message;
-- SELECT count(*) as user_count FROM public."appUsers";
-- SELECT id, email, primary_role FROM public."appUsers" LIMIT 3;

SELECT 'appUsers permissions fixed with case-sensitive naming' as status;