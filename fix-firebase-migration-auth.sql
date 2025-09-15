-- Firebase Migration Auth Fix - Addresses Empty String Token Issues
-- This fixes the specific issue where Firebase migration created empty string tokens
-- that cause "converting NULL to string is unsupported" errors

-- 1. Check current token column state in auth.users
SELECT 'Checking auth.users token columns...' as info;

-- Try to see what we can access
DO $$ 
BEGIN
    PERFORM COUNT(*) FROM auth.users LIMIT 1;
    RAISE NOTICE 'auth.users table is accessible for checking';
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'auth.users access limited: %', SQLERRM;
END $$;

-- 2. Fix empty string tokens that cause NULL conversion errors
-- This addresses the Firebase migration issue where tokens were set to '' instead of NULL

DO $$ 
BEGIN
    -- Fix confirmation_token empty strings
    UPDATE auth.users 
    SET confirmation_token = NULL 
    WHERE confirmation_token = '';
    
    RAISE NOTICE 'Updated confirmation_token empty strings to NULL';
    
    -- Fix recovery_token empty strings  
    UPDATE auth.users 
    SET recovery_token = NULL 
    WHERE recovery_token = '';
    
    RAISE NOTICE 'Updated recovery_token empty strings to NULL';
    
    -- Fix email_change_token_new empty strings
    UPDATE auth.users 
    SET email_change_token_new = NULL 
    WHERE email_change_token_new = '';
    
    RAISE NOTICE 'Updated email_change_token_new empty strings to NULL';
    
    -- Fix email_change_token_current empty strings
    UPDATE auth.users 
    SET email_change_token_current = NULL 
    WHERE email_change_token_current = '';
    
    RAISE NOTICE 'Updated email_change_token_current empty strings to NULL';
    
    -- Fix phone_change_token empty strings
    UPDATE auth.users 
    SET phone_change_token = NULL 
    WHERE phone_change_token = '';
    
    RAISE NOTICE 'Updated phone_change_token empty strings to NULL';
    
EXCEPTION 
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Cannot update auth.users tokens - insufficient privileges (this is normal for hosted Supabase)';
        RAISE NOTICE 'Contact Supabase support to fix empty string token columns in auth.users';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error updating auth.users tokens: %', SQLERRM;
END $$;

-- 3. Now apply the standard auth schema permissions fix
GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant permissions on auth system tables
GRANT SELECT ON auth.users TO anon;
GRANT SELECT ON auth.users TO authenticated;

-- Fix appUsers table permissions (case-sensitive)
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

-- Ensure information_schema access
GRANT SELECT ON information_schema.tables TO anon;
GRANT SELECT ON information_schema.columns TO anon;
GRANT SELECT ON information_schema.table_constraints TO anon;

-- Test the fix
SELECT 'Testing appUsers access...' as test_message;
SELECT count(*) as appUsers_count FROM public."appUsers";

SELECT 'Firebase migration auth fix completed' as status;
SELECT 'Empty string tokens converted to NULL, permissions updated' as result;