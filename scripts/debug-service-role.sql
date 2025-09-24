-- Debug service role configuration and access

-- 1. Check current database roles
SELECT 
    rolname,
    rolsuper,
    rolcanlogin
FROM pg_roles
WHERE rolname IN ('service_role', 'postgres');

-- 2. Test if we can access invoice_items with a simple query
SELECT 
    COUNT(*) as total_items
FROM invoice_items;

-- 3. Test access to a specific invoice
SELECT 
    COUNT(*) as specific_invoice_items
FROM invoice_items 
WHERE invoice_id = 'd05a5002-33f2-4219-9d1b-236d23328af2';

-- 4. Check if RLS is enabled
SELECT 
    relname,
    relrowsecurity AS rls_enabled,
    relforcerowsecurity AS force_rls
FROM pg_class
WHERE relname = 'invoice_items';