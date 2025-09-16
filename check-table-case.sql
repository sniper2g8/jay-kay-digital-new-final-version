-- Check for table case consistency issues
-- This SQL will identify if we have both appusers and appUsers

-- First, check what appUser-related tables exist
SELECT 
  'TABLE_CHECK' as check_type,
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name ILIKE '%appuser%'
ORDER BY table_name;

-- Check for the specific case variations we're concerned about
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'appusers') 
    THEN 'EXISTS' 
    ELSE 'NOT EXISTS' 
  END as appusers_lowercase,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'appUsers') 
    THEN 'EXISTS' 
    ELSE 'NOT EXISTS' 
  END as appUsers_camelcase;