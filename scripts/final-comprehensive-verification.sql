-- Final comprehensive verification that the invoice_items RLS fix is working correctly

-- 1. Check RLS status
SELECT 
    relname AS table_name,
    relrowsecurity AS rls_enabled,
    relforcerowsecurity AS force_rls
FROM pg_class 
WHERE relname = 'invoice_items';

-- 2. List all policies
SELECT 
    polname AS policy_name,
    polpermissive AS permissive,
    polcmd AS command,
    polroles AS roles
FROM pg_policy 
WHERE polrelid = 'invoice_items'::regclass
ORDER BY polname;

-- 3. Verify data access is working
SELECT 
    COUNT(*) as total_invoice_items
FROM invoice_items;

-- 4. Check sample data with proper relationships
SELECT 
    ii.id,
    ii.invoice_id,
    ii.description,
    ii.quantity,
    ii.unit_price,
    i.invoiceNo,
    i.customer_id,
    i.generated_by
FROM invoice_items ii
JOIN invoices i ON ii.invoice_id = i.id
LIMIT 10;

-- 5. Verify that all invoice items have valid invoice references
SELECT 
    COUNT(*) as total_items,
    COUNT(i.id) as items_with_valid_invoices,
    COUNT(*) - COUNT(i.id) as orphaned_items
FROM invoice_items ii
LEFT JOIN invoices i ON ii.invoice_id = i.id;

-- 6. Check the structure of key columns
SELECT 
    'invoice_items' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoice_items'
AND column_name IN ('id', 'invoice_id', 'description', 'quantity', 'unit_price', 'total')
UNION ALL
SELECT 
    'invoices' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoices'
AND column_name IN ('id', 'customer_id', 'generated_by')
ORDER BY table_name, column_name;

-- 7. Final confirmation that the fix is complete
SELECT 
    'INVOICE ITEMS RLS FIX STATUS' as status_check,
    CASE 
        WHEN (SELECT relrowsecurity FROM pg_class WHERE relname = 'invoice_items') = true 
        THEN 'RLS ENABLED: ✅' 
        ELSE 'RLS ENABLED: ❌' 
    END as rls_status,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_policy WHERE polrelid = 'invoice_items'::regclass) > 0 
        THEN 'POLICIES EXIST: ✅' 
        ELSE 'POLICIES EXIST: ❌' 
    END as policies_status,
    CASE 
        WHEN (SELECT COUNT(*) FROM invoice_items) > 0 
        THEN 'DATA ACCESS: ✅' 
        ELSE 'DATA ACCESS: ❌' 
    END as data_access_status;