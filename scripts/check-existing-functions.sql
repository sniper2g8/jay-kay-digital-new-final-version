-- Check for any existing functions related to invoice items RLS

-- 1. Check if fix_invoice_items_rls function exists
SELECT 
    proname AS function_name,
    pg_get_functiondef(oid) AS function_definition
FROM pg_proc
WHERE proname = 'fix_invoice_items_rls'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 2. Check current RLS status for invoice_items
SELECT 
    relname AS table_name,
    relrowsecurity AS rls_enabled,
    relforcerowsecurity AS force_rls
FROM pg_class 
WHERE relname = 'invoice_items';

-- 3. Check existing policies on invoice_items
SELECT 
    polname AS policy_name,
    polpermissive AS permissive,
    polroles AS roles,
    polcmd AS command,
    polqual AS using_clause,
    polwithcheck AS with_check_clause
FROM pg_policy 
WHERE polrelid = 'invoice_items'::regclass
ORDER BY polname;