-- Execute the existing fix_invoice_items_rls function
-- This function should properly set up RLS policies for the invoice_items table

-- 1. Execute the function
SELECT public.fix_invoice_items_rls();

-- 2. Check if RLS is now enabled
SELECT 
    relname AS table_name,
    relrowsecurity AS rls_enabled,
    relforcerowsecurity AS force_rls
FROM pg_class 
WHERE relname = 'invoice_items';

-- 3. Check the policies that were created
SELECT 
    polname AS policy_name,
    polpermissive AS permissive,
    polcmd AS command,
    polqual AS using_clause,
    polwithcheck AS with_check_clause
FROM pg_policy 
WHERE polrelid = 'invoice_items'::regclass
ORDER BY polname;

-- 4. Test access to the table
SELECT 
    COUNT(*) as invoice_items_count
FROM invoice_items;

-- 5. Check a few sample rows
SELECT 
    id,
    invoice_id,
    description,
    quantity,
    unit_price
FROM invoice_items
LIMIT 5;