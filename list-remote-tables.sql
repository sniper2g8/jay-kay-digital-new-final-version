-- Query to list all tables in remote Supabase database
-- Run this in Supabase SQL Editor to see what tables actually exist

-- Option 1: List all tables in public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Option 2: More detailed table information
SELECT 
    table_name,
    table_type,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Option 3: List tables with column count
SELECT 
    t.table_name,
    COUNT(c.column_name) as column_count
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name 
WHERE t.table_schema = 'public'
GROUP BY t.table_name
ORDER BY t.table_name;

-- Option 4: Check if specific tables exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'appUsers') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as appUsers_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as users_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as profiles_status;