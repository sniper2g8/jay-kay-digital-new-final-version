-- Simple auth.users accessibility check
-- This focuses on what we can actually see and access

-- 1. Check if we can see any auth schema tables at all
SELECT 'Auth schema tables visible:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'auth'
ORDER BY table_name;

-- 2. Try to access auth.users directly with minimal data
SELECT 'Testing direct auth.users access...' as info;
DO $$ 
BEGIN
    -- Try to get basic info without seeing sensitive columns
    DECLARE
        user_count integer;
    BEGIN
        SELECT COUNT(*) INTO user_count FROM auth.users;
        RAISE NOTICE 'auth.users contains % users', user_count;
    EXCEPTION 
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'Cannot access auth.users - insufficient privileges (normal for hosted Supabase)';
        WHEN undefined_table THEN
            RAISE NOTICE 'auth.users table not found';
        WHEN OTHERS THEN
            RAISE NOTICE 'Error: %', SQLERRM;
    END;
END $$;

-- 3. Check what columns we can see in appUsers (our main table)
SELECT 'appUsers table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'appUsers'
ORDER BY ordinal_position;

-- 4. Check current appUsers data to understand the auth relationship
SELECT 'Sample appUsers data:' as info;
SELECT 
    id,
    email,
    name,
    "Display_name",
    provider,
    created_at
FROM public."appUsers"
ORDER BY created_at DESC
LIMIT 5;

-- 5. Check if there are any auth-related issues in appUsers
SELECT 'appUsers data analysis:' as info;
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as has_email,
    COUNT(CASE WHEN name IS NOT NULL AND name != '' THEN 1 END) as has_name,
    COUNT(CASE WHEN "Display_name" IS NOT NULL AND "Display_name" != '' THEN 1 END) as has_display_name,
    COUNT(CASE WHEN provider IS NOT NULL AND provider != '' THEN 1 END) as has_provider
FROM public."appUsers";

SELECT 'Auth accessibility check completed' as status;