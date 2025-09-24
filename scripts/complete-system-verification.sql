-- Complete system verification that the invoice_items RLS fix is working correctly

-- 1. Confirm RLS status on invoice_items
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
    polcmd AS command
FROM pg_policy 
WHERE polrelid = 'invoice_items'::regclass
ORDER BY polname;

-- 3. Verify data access to invoice_items
SELECT 
    COUNT(*) as total_invoice_items
FROM invoice_items;

-- 4. Check sample data with complete invoice information
SELECT 
    ii.id,
    ii.description,
    ii.quantity,
    ii.unit_price,
    i.invoiceNo,
    i.customer_id,
    i.generated_by
FROM invoice_items ii
JOIN invoices i ON ii.invoice_id = i.id
LIMIT 10;

-- 5. Verify all invoice items have valid invoice references
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
AND column_name IN ('id', 'invoice_id', 'description', 'quantity', 'unit_price')
UNION ALL
SELECT 
    'invoices' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoices'
AND column_name IN ('id', 'invoiceNo', 'customer_id', 'generated_by')
ORDER BY table_name, column_name;

-- 7. Verify appUsers table structure
SELECT 
    primary_role,
    COUNT(*) as user_count
FROM appUsers
GROUP BY primary_role
ORDER BY user_count DESC;

-- 8. Final comprehensive status
SELECT 
    'COMPLETE SYSTEM VERIFICATION' as verification_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM invoice_items) > 0 
        THEN 'DATA ACCESS: ✅ WORKING' 
        ELSE 'DATA ACCESS: ❌ NOT WORKING' 
    END as data_access,
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
        WHEN (SELECT COUNT(*) FROM invoice_items ii LEFT JOIN invoices i ON ii.invoice_id = i.id WHERE i.id IS NULL) = 0 
        THEN 'DATA INTEGRITY: ✅' 
        ELSE 'DATA INTEGRITY: ❌' 
    END as data_integrity,
    CASE 
        WHEN (SELECT COUNT(*) FROM appUsers WHERE primary_role IN ('admin', 'super_admin')) > 0 
        THEN 'ADMIN ROLES: ✅' 
        ELSE 'ADMIN ROLES: ❌' 
    END as admin_roles;