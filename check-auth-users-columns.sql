-- Query to check columns in auth.users table
-- This will show all columns, their data types, and properties

-- 1. Check if auth.users table exists and get column information
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'auth' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. Alternative query if the above doesn't work (for some Supabase setups)
SELECT 
    attname as column_name,
    pg_catalog.format_type(atttypid, atttypmod) as data_type,
    NOT attnotnull as is_nullable,
    attnum as position
FROM pg_catalog.pg_attribute 
WHERE attrelid = (
    SELECT oid 
    FROM pg_catalog.pg_class 
    WHERE relname = 'users' 
      AND relnamespace = (
        SELECT oid 
        FROM pg_catalog.pg_namespace 
        WHERE nspname = 'auth'
      )
)
  AND attnum > 0 
  AND NOT attisdropped
ORDER BY attnum;

-- 3. Check what we can access from auth.users (might be limited in hosted Supabase)
DO $$ 
BEGIN
    -- Try to describe the structure we can see
    RAISE NOTICE 'Attempting to check auth.users structure...';
    
    -- This might fail due to permissions, but let's try
    PERFORM * FROM auth.users LIMIT 1;
    RAISE NOTICE 'auth.users table is accessible';
EXCEPTION 
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Limited access to auth.users (normal for hosted Supabase)';
    WHEN undefined_table THEN
        RAISE NOTICE 'auth.users table not found or not accessible';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error accessing auth.users: %', SQLERRM;
END $$;

-- 4. Check specific columns that commonly cause issues
SELECT 'Checking for common auth.users columns...' as info;

-- Try to see if we can detect the problematic columns
DO $$ 
BEGIN
    -- Check if confirmation_token exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'auth' 
          AND table_name = 'users' 
          AND column_name = 'confirmation_token'
    ) THEN
        RAISE NOTICE 'confirmation_token column exists in auth.users';
    ELSE
        RAISE NOTICE 'confirmation_token column not found or not accessible';
    END IF;
    
    -- Check if recovery_token exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'auth' 
          AND table_name = 'users' 
          AND column_name = 'recovery_token'
    ) THEN
        RAISE NOTICE 'recovery_token column exists in auth.users';
    ELSE
        RAISE NOTICE 'recovery_token column not found or not accessible';
    END IF;
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'Cannot check column existence: %', SQLERRM;
END $$;