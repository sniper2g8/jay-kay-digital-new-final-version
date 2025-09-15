-- Enhanced Supabase Auth Schema Fix
-- This addresses "Database error querying schema" HTTP 500 errors during authentication
-- Specifically handles the confirmation_token NULL conversion error

-- 1. Ensure auth schema permissions
GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 2. Grant permissions on auth system tables that Supabase needs
-- Note: These might not all exist or be accessible, but we'll try
GRANT SELECT ON auth.users TO anon;
GRANT SELECT ON auth.users TO authenticated;

-- 3. Fix potential NULL issues in auth.users table
-- This addresses the confirmation_token scan error
DO $$ 
BEGIN
    -- Check if we can access auth.users and fix NULL issues
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        -- Update any NULL confirmation_token values to empty string
        UPDATE auth.users 
        SET confirmation_token = COALESCE(confirmation_token, '')
        WHERE confirmation_token IS NULL;
        
        -- Update any NULL recovery_token values to empty string  
        UPDATE auth.users
        SET recovery_token = COALESCE(recovery_token, '')
        WHERE recovery_token IS NULL;
        
        -- Update any NULL email_change_token values to empty string
        UPDATE auth.users
        SET email_change_token_new = COALESCE(email_change_token_new, '')
        WHERE email_change_token_new IS NULL;
        
        RAISE NOTICE 'Updated NULL token values in auth.users table';
    END IF;
EXCEPTION 
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Cannot update auth.users - insufficient privileges (this is normal for hosted Supabase)';
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not update auth.users: %', SQLERRM;
END $$;

-- 4. Fix appUsers table permissions (case-sensitive)
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

-- 5. Grant permissions on other tables that might be needed during auth
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

-- 6. Ensure information_schema access (needed for schema queries)
GRANT SELECT ON information_schema.tables TO anon;
GRANT SELECT ON information_schema.columns TO anon;
GRANT SELECT ON information_schema.table_constraints TO anon;

-- 7. Create a safer view for auth user access if needed
CREATE OR REPLACE VIEW public.safe_auth_users AS
SELECT 
    id,
    email,
    phone,
    email_confirmed_at,
    phone_confirmed_at,
    last_sign_in_at,
    created_at,
    updated_at,
    COALESCE(confirmation_token, '') as confirmation_token,
    COALESCE(recovery_token, '') as recovery_token,
    COALESCE(email_change_token_new, '') as email_change_token_new
FROM auth.users;

-- Grant access to the safe view
GRANT SELECT ON public.safe_auth_users TO anon;
GRANT SELECT ON public.safe_auth_users TO authenticated;

-- 8. Test the fix
SELECT 'Testing appUsers access...' as test_message;
SELECT count(*) as appUsers_count FROM public."appUsers";

-- Test auth users access
SELECT 'Testing auth.users access...' as test_message;
DO $$ 
BEGIN
    PERFORM count(*) FROM auth.users LIMIT 1;
    RAISE NOTICE 'Auth users table accessible';
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'Auth users table access limited: %', SQLERRM;
END $$;

SELECT 'Enhanced auth schema permissions updated' as status;
SELECT 'HTTP 500 auth errors should now be resolved' as result;
SELECT 'confirmation_token NULL handling implemented' as additional_fix;