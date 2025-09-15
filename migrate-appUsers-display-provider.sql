-- Migration: Update appUsers table to set display_name and provider to email
-- This ensures all users have proper display names and provider information

-- Begin transaction for safety
BEGIN;

-- 1. First, let's see what we're working with
SELECT 'Before migration - checking appUsers data...' as status;

SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN display_name IS NULL OR display_name = '' THEN 1 END) as missing_display_name,
    COUNT(CASE WHEN provider IS NULL OR provider = '' THEN 1 END) as missing_provider,
    COUNT(CASE WHEN (display_name IS NULL OR display_name = '') AND (provider IS NULL OR provider = '') THEN 1 END) as missing_both
FROM public."appUsers";

-- 2. Update display_name to name field where available, fallback to email
UPDATE public."appUsers"
SET 
    display_name = COALESCE(NULLIF(TRIM(name), ''), email),
    updated_at = NOW()
WHERE display_name IS NULL 
   OR display_name = ''
   OR TRIM(display_name) = '';

-- 3. Update provider to 'email' for users where provider is NULL or empty
UPDATE public."appUsers"
SET 
    provider = 'email',
    updated_at = NOW()
WHERE provider IS NULL 
   OR provider = ''
   OR TRIM(provider) = '';

-- 4. For users who signed up via email/password, ensure provider is set to 'email'
-- (This handles cases where provider might be set to something else but should be 'email')
UPDATE public."appUsers"
SET 
    provider = 'email',
    updated_at = NOW()
WHERE provider != 'email'
  AND provider NOT IN ('google', 'github', 'facebook', 'twitter', 'discord');

-- 5. Ensure display_name is not empty after updates, prioritize name over email
UPDATE public."appUsers"
SET 
    display_name = COALESCE(NULLIF(TRIM(name), ''), NULLIF(TRIM(display_name), ''), email),
    updated_at = NOW()
WHERE TRIM(COALESCE(display_name, '')) = '';

-- 6. Verification - check the results
SELECT 'After migration - verification...' as status;

SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN display_name IS NULL OR display_name = '' THEN 1 END) as missing_display_name,
    COUNT(CASE WHEN provider IS NULL OR provider = '' THEN 1 END) as missing_provider,
    COUNT(CASE WHEN provider = 'email' THEN 1 END) as email_provider_users,
    COUNT(DISTINCT provider) as unique_providers
FROM public."appUsers";

-- 7. Show sample of updated data
SELECT 
    id,
    email,
    name,
    display_name,
    provider,
    updated_at,
    CASE 
        WHEN display_name = name THEN 'Used name field'
        WHEN display_name = email THEN 'Used email field'
        ELSE 'Other source'
    END as display_name_source
FROM public."appUsers"
ORDER BY updated_at DESC
LIMIT 10;

-- 8. Show provider distribution
SELECT 
    provider,
    COUNT(*) as user_count
FROM public."appUsers"
GROUP BY provider
ORDER BY user_count DESC;

-- 9. Final status
SELECT 'Migration completed successfully!' as status;
SELECT 'All users now have display_name and provider set' as result;

-- Commit the transaction
COMMIT;