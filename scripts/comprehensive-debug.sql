-- Comprehensive debug script to identify the root cause of the 500 error

-- 1. Check if the invoice exists
SELECT 
    'Invoice Check' as test,
    CASE 
        WHEN EXISTS (SELECT 1 FROM invoices WHERE id = 'd05a5002-33f2-4219-9d1b-236d23328af2') 
        THEN 'INVOICE EXISTS: ✅' 
        ELSE 'INVOICE EXISTS: ❌' 
    END as result;

-- 2. Check if there are items for this invoice
SELECT 
    'Invoice Items Check' as test,
    CASE 
        WHEN EXISTS (SELECT 1 FROM invoice_items WHERE invoice_id = 'd05a5002-33f2-4219-9d1b-236d23328af2') 
        THEN 'ITEMS EXIST: ✅' 
        ELSE 'ITEMS EXIST: ❌' 
    END as result,
    (SELECT COUNT(*) FROM invoice_items WHERE invoice_id = 'd05a5002-33f2-4219-9d1b-236d23328af2') as item_count;

-- 3. Check RLS status
SELECT 
    'RLS Status' as test,
    CASE 
        WHEN (SELECT relrowsecurity FROM pg_class WHERE relname = 'invoice_items') = true 
        THEN 'RLS ENABLED: ✅' 
        ELSE 'RLS ENABLED: ❌' 
    END as result;

-- 4. Check number of policies
SELECT 
    'Policy Count' as test,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_policy WHERE polrelid = 'invoice_items'::regclass) > 0 
        THEN 'POLICIES EXIST: ✅' 
        ELSE 'POLICIES EXIST: ❌' 
    END as result,
    (SELECT COUNT(*) FROM pg_policy WHERE polrelid = 'invoice_items'::regclass) as policy_count;

-- 5. Check if service role exists
SELECT 
    'Service Role' as test,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') 
        THEN 'SERVICE ROLE EXISTS: ✅' 
        ELSE 'SERVICE ROLE EXISTS: ❌' 
    END as result;

-- 6. Test basic data access
SELECT 
    'Basic Access' as test,
    CASE 
        WHEN (SELECT COUNT(*) FROM invoice_items) >= 0 
        THEN 'BASIC ACCESS: ✅' 
        ELSE 'BASIC ACCESS: ❌' 
    END as result,
    (SELECT COUNT(*) FROM invoice_items) as total_items;

-- 7. Check the specific user's role
SELECT 
    'User Role Check' as test,
    CASE 
        WHEN EXISTS (SELECT 1 FROM appUsers WHERE id = '337eb073-1bfd-4879-94b7-653bda239e06') 
        THEN 'USER EXISTS: ✅' 
        ELSE 'USER EXISTS: ❌' 
    END as result,
    (SELECT primary_role FROM appUsers WHERE id = '337eb073-1bfd-4879-94b7-653bda239e06') as user_role;

-- 8. Check if user has admin privileges
SELECT 
    'Admin Privileges' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM appUsers 
            WHERE id = '337eb073-1bfd-4879-94b7-653bda239e06' 
            AND primary_role IN ('admin', 'super_admin')
        ) 
        THEN 'ADMIN PRIVILEGES: ✅' 
        ELSE 'ADMIN PRIVILEGES: ❌' 
    END as result;