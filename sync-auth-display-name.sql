-- Sync Auth User Display_name with appUsers.name
-- This migration ensures Display_name in appUsers matches the name field

-- 1. Check current state - compare name vs Display_name
SELECT 'Current appUsers name vs Display_name status:' as info;

SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN name IS NOT NULL AND name != '' THEN 1 END) as has_name,
    COUNT(CASE WHEN "Display_name" IS NOT NULL AND "Display_name" != '' THEN 1 END) as has_Display_name,
    COUNT(CASE WHEN name = "Display_name" THEN 1 END) as name_matches_Display_name,
    COUNT(CASE WHEN name != "Display_name" AND name IS NOT NULL AND name != '' THEN 1 END) as name_differs_from_Display_name
FROM public."appUsers";

-- 2. Show examples of current data
SELECT 
    id,
    email,
    name,
    "Display_name",
    CASE 
        WHEN name IS NULL OR name = '' THEN 'No name'
        WHEN "Display_name" IS NULL OR "Display_name" = '' THEN 'No Display_name'
        WHEN name = "Display_name" THEN 'Match'
        ELSE 'Different'
    END as status
FROM public."appUsers"
ORDER BY created_at DESC
LIMIT 10;

-- 3. Update Display_name to use name field where name exists
-- Priority: name -> email (if name is empty/null)
UPDATE public."appUsers"
SET "Display_name" = CASE 
    WHEN name IS NOT NULL AND TRIM(name) != '' THEN TRIM(name)
    ELSE email
END
WHERE "Display_name" IS NULL 
   OR "Display_name" = ''
   OR (name IS NOT NULL AND TRIM(name) != '' AND "Display_name" != TRIM(name));

-- 4. Ensure provider is set for all users
UPDATE public."appUsers"
SET provider = 'email'
WHERE provider IS NULL OR provider = '';

-- 5. Final verification
SELECT 'After sync - verification:' as info;

SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN name IS NOT NULL AND name != '' THEN 1 END) as has_name,
    COUNT(CASE WHEN "Display_name" IS NOT NULL AND "Display_name" != '' THEN 1 END) as has_Display_name,
    COUNT(CASE WHEN name = "Display_name" THEN 1 END) as name_matches_Display_name,
    COUNT(CASE WHEN "Display_name" = email THEN 1 END) as Display_name_is_email,
    COUNT(CASE WHEN provider = 'email' THEN 1 END) as email_provider_users
FROM public."appUsers";

-- 6. Show final results
SELECT 
    id,
    email,
    name,
    "Display_name",
    provider,
    CASE 
        WHEN name = "Display_name" THEN '✓ Name used'
        WHEN "Display_name" = email THEN '✓ Email used (no name)'
        ELSE '? Other'
    END as result
FROM public."appUsers"
ORDER BY created_at DESC;

SELECT 'Auth User Display_name sync completed!' as status;
SELECT 'Display_name now matches appUsers.name where available' as result;