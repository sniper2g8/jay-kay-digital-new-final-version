-- Investigate the existing fix_invoice_items_rls function

-- 1. Check if the function exists and get its definition
SELECT 
    proname AS function_name,
    pg_get_functiondef(oid) AS function_definition
FROM pg_proc
WHERE proname = 'fix_invoice_items_rls'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 2. If the function exists, try to execute it
-- SELECT public.fix_invoice_items_rls();

-- 3. Check policies after potentially running the function
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