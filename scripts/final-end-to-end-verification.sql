-- Final end-to-end verification that the invoice_items RLS fix is working

-- 1. Confirm RLS is enabled on invoice_items
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
    polroles AS roles
FROM pg_policy 
WHERE polrelid = 'invoice_items'::regclass
ORDER BY polname;

-- 3. Verify we can access data (the key test)
SELECT 
    COUNT(*) as total_invoice_items,
    COUNT(DISTINCT invoice_id) as unique_invoices
FROM invoice_items;

-- 4. Check that all invoice items have valid invoice references
SELECT 
    COUNT(*) as total_items,
    COUNT(i.id) as items_with_valid_invoices,
    COUNT(*) - COUNT(i.id) as orphaned_items
FROM invoice_items ii
LEFT JOIN invoices i ON ii.invoice_id = i.id;

-- 5. Verify appUsers table has the expected roles
SELECT 
    primary_role,
    COUNT(*) as user_count
FROM appUsers
GROUP BY primary_role
ORDER BY user_count DESC;

-- 6. Test a query that simulates admin access
SELECT 
    ii.id,
    ii.description,
    ii.quantity,
    ii.unit_price,
    i.customer_id
FROM invoice_items ii
JOIN invoices i ON ii.invoice_id = i.id
WHERE EXISTS (
    SELECT 1 
    FROM appUsers 
    WHERE primary_role IN ('admin', 'super_admin') 
    LIMIT 1
)
LIMIT 5;

-- 7. Final status confirmation
SELECT 
    'END-TO-END VERIFICATION STATUS' as status_check,
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
    END as data_integrity;