-- Check appUsers table structure and data
-- This helps us understand what fields need to be updated

-- 1. Check the current structure of appUsers table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'appUsers' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check current data in appUsers table
SELECT 
    id,
    email,
    display_name,
    provider,
    created_at,
    updated_at
FROM public."appUsers"
ORDER BY created_at DESC
LIMIT 20;

-- 3. Check for users with missing display_name or provider
SELECT 
    id,
    email,
    display_name,
    provider,
    CASE 
        WHEN display_name IS NULL OR display_name = '' THEN 'Missing display_name'
        ELSE 'Has display_name'
    END as display_name_status,
    CASE 
        WHEN provider IS NULL OR provider = '' THEN 'Missing provider'
        ELSE 'Has provider'
    END as provider_status
FROM public."appUsers"
WHERE display_name IS NULL 
   OR display_name = '' 
   OR provider IS NULL 
   OR provider = '';

-- 4. Count users that need updates
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN display_name IS NULL OR display_name = '' THEN 1 END) as missing_display_name,
    COUNT(CASE WHEN provider IS NULL OR provider = '' THEN 1 END) as missing_provider
FROM public."appUsers";