-- Final verification that the invoice_items table is working correctly

-- 1. Confirm RLS status
SELECT 
    relname AS table_name,
    relrowsecurity AS rls_enabled,
    relforcerowsecurity AS force_rls
FROM pg_class 
WHERE relname = 'invoice_items';

-- 2. List all policies to confirm they exist
SELECT 
    polname AS policy_name,
    polpermissive AS permissive,
    polcmd AS command
FROM pg_policy 
WHERE polrelid = 'invoice_items'::regclass
ORDER BY polname;

-- 3. Verify we can access data (the key test)
SELECT 
    COUNT(*) as total_invoice_items,
    COUNT(DISTINCT invoice_id) as unique_invoices
FROM invoice_items;

-- 4. Check the sample data we retrieved matches what we expect
SELECT 
    id,
    invoice_id,
    description,
    quantity,
    unit_price,
    (quantity * unit_price) as calculated_total
FROM invoice_items
WHERE invoice_id = 'a0afea9e-8d7b-4a2e-afe0-1e104805a11d'
ORDER BY id;

-- 5. Verify the data makes sense (no negative quantities or prices)
SELECT 
    MIN(quantity) as min_quantity,
    MAX(quantity) as max_quantity,
    MIN(unit_price) as min_price,
    MAX(unit_price) as max_price
FROM invoice_items;

-- 6. Check that all invoice items have valid invoice references
SELECT 
    COUNT(*) as total_items,
    COUNT(i.id) as items_with_valid_invoices,
    COUNT(*) - COUNT(i.id) as orphaned_items
FROM invoice_items ii
LEFT JOIN invoices i ON ii.invoice_id = i.id;

-- 7. Final status confirmation
SELECT 
    'INVOICE ITEMS TABLE STATUS' as status_check,
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
    END as policies_status;