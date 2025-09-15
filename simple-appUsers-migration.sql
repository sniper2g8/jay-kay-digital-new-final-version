-- Simple appUsers Migration: Set display_name to name and provider fields
-- Run this in Supabase SQL Editor

-- 1. Check current state
SELECT 'Current appUsers status:' as info;
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN display_name IS NULL OR display_name = '' THEN 1 END) as missing_display_name,
    COUNT(CASE WHEN provider IS NULL OR provider = '' THEN 1 END) as missing_provider,
    COUNT(CASE WHEN name IS NOT NULL AND name != '' THEN 1 END) as has_name
FROM public."appUsers";

-- 2. Update display_name to name where name exists, otherwise use email
UPDATE public."appUsers"
SET display_name = COALESCE(NULLIF(name, ''), email)
WHERE display_name IS NULL OR display_name = '';

-- 3. Update provider to 'email' where missing
UPDATE public."appUsers"
SET provider = 'email'
WHERE provider IS NULL OR provider = '';

-- 4. Verify the updates
SELECT 'After migration:' as info;
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN display_name IS NULL OR display_name = '' THEN 1 END) as missing_display_name,
    COUNT(CASE WHEN provider IS NULL OR provider = '' THEN 1 END) as missing_provider,
    COUNT(CASE WHEN display_name = name THEN 1 END) as display_name_from_name,
    COUNT(CASE WHEN display_name = email THEN 1 END) as display_name_from_email
FROM public."appUsers";

-- 5. Show updated data
SELECT 
    id,
    email,
    name,
    display_name,
    provider,
    CASE 
        WHEN display_name = name THEN 'Used name'
        WHEN display_name = email THEN 'Used email'
        ELSE 'Other'
    END as display_name_source
FROM public."appUsers"
ORDER BY created_at DESC;

SELECT 'Migration completed! Display names set to name field where available.' as status;