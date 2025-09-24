-- Check if the fix_invoice_items_rls function exists and what it does

-- 1. Check if the function exists
SELECT 
    proname AS function_name,
    pg_get_functiondef(oid) AS function_definition
FROM pg_proc
WHERE proname = 'fix_invoice_items_rls'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 2. Check if there's a similar function in any schema
SELECT 
    n.nspname AS schema_name,
    p.proname AS function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname ILIKE '%fix%invoice%items%'
ORDER BY n.nspname, p.proname;