-- Verify that the RLS fix for invoice_items table is complete and working

-- 1. Check RLS status for invoice_items table
SELECT 
    relname AS table_name,
    relrowsecurity AS rls_enabled,
    relforcerowsecurity AS force_rls
FROM pg_class 
WHERE relname = 'invoice_items';

-- 2. List all policies on invoice_items to confirm they were created
SELECT 
    polname AS policy_name,
    polpermissive AS permissive,
    polcmd AS command,
    polroles AS roles
FROM pg_policy 
WHERE polrelid = 'invoice_items'::regclass
ORDER BY polname;

-- 3. Test data access (as service role)
SELECT 
    COUNT(*) as invoice_items_count
FROM invoice_items;

-- 4. Check sample data with invoice relationships
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
LIMIT 5;

-- 5. Verify that the invoice_id column properly references invoices
SELECT 
    COUNT(*) as total_items,
    COUNT(i.id) as items_with_valid_invoices
FROM invoice_items ii
LEFT JOIN invoices i ON ii.invoice_id = i.id;