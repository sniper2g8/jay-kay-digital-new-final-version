-- Check if RLS policies were created and what permissions exist
-- Run this in your Supabase SQL Editor to diagnose the issue

-- 1. Check if RLS is enabled on tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('customers', 'jobs', 'invoices', 'payments')
ORDER BY tablename;

-- 2. Check what RLS policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('customers', 'jobs', 'invoices', 'payments')
ORDER BY tablename, policyname;

-- 3. Check table permissions for anon role
SELECT 
    table_schema,
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
    AND table_name IN ('customers', 'jobs', 'invoices', 'payments')
    AND grantee = 'anon'
ORDER BY table_name, privilege_type;

-- 4. Check if anon role exists and its properties
SELECT 
    rolname,
    rolsuper,
    rolinherit,
    rolcreaterole,
    rolcreatedb,
    rolcanlogin,
    rolreplication
FROM pg_roles 
WHERE rolname IN ('anon', 'authenticated', 'service_role');

-- 5. Check schema permissions (using pg_namespace and pg_authid)
SELECT 
    n.nspname as schema_name,
    r.rolname as grantee,
    CASE 
        WHEN has_schema_privilege(r.rolname, n.nspname, 'USAGE') THEN 'USAGE'
        ELSE 'NO USAGE'
    END as privilege_type
FROM pg_namespace n
CROSS JOIN pg_roles r
WHERE n.nspname = 'public'
    AND r.rolname IN ('anon', 'authenticated', 'service_role', 'postgres')
ORDER BY r.rolname;
