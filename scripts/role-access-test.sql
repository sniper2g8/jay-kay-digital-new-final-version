-- Check existing roles in the database
SELECT 
    rolname,
    rolsuper,
    rolinherit,
    rolcreaterole,
    rolcreatedb,
    rolcanlogin
FROM pg_roles
WHERE rolname IN ('postgres', 'service_role', 'authenticated', 'anon');

-- Test access with different roles
-- First, check the current user
SELECT 
    CURRENT_USER,
    SESSION_USER;

-- Try to set role to service_role and check access
-- Note: This might not work in all environments
-- SET ROLE service_role;
-- SELECT COUNT(*) FROM invoice_items;
-- RESET ROLE;

-- Check if we can query the table with explicit schema
SELECT 
    COUNT(*) as count_with_schema
FROM public.invoice_items;