-- Check if there are any existing RLS policies on the invoice_items table

-- 1. Check RLS status for invoice_items table
SELECT 
    relname AS table_name,
    relrowsecurity AS rls_enabled,
    relforcerowsecurity AS force_rls
FROM pg_class 
WHERE relname = 'invoice_items';

-- 2. Check existing policies on invoice_items table
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

-- 3. Check if the fix_invoice_items_rls function exists and try to run it
SELECT 
    proname AS function_name,
    prosrc AS function_source
FROM pg_proc
WHERE proname = 'fix_invoice_items_rls'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');