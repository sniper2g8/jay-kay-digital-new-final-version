-- Final verification that the invoice_items RLS fix is working correctly

-- 1. Check RLS status
SELECT 
    relname AS table_name,
    relrowsecurity AS rls_enabled,
    relforcerowsecurity AS force_rls
FROM pg_class 
WHERE relname = 'invoice_items';

-- 2. List all policies on invoice_items
SELECT 
    polname AS policy_name,
    polpermissive AS permissive,
    polcmd AS command,
    polqual AS using_clause,
    polwithcheck AS with_check_clause
FROM pg_policy 
WHERE polrelid = 'invoice_items'::regclass
ORDER BY polname;

-- 3. Verify the function definitions are correct
SELECT 
    proname AS function_name
FROM pg_proc
WHERE proname IN ('fix_invoice_items_rls', 'fix_invoice_line_items_rls')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 4. Test data access
SELECT 
    COUNT(*) as total_invoice_items
FROM invoice_items;

-- 5. Check sample data with invoice relationships
SELECT 
    ii.id,
    ii.invoice_id,
    i.customer_id,
    i.generated_by,
    ii.description,
    ii.quantity,
    ii.unit_price
FROM invoice_items ii
LEFT JOIN invoices i ON ii.invoice_id = i.id
LIMIT 10;

-- 6. Check that we can access the columns needed for RLS policies
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoice_items'
AND column_name IN ('invoice_id')
UNION ALL
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoices'
AND column_name IN ('id', 'customer_id', 'generated_by');