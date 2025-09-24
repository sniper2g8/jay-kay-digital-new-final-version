-- Verify that the RLS fix for invoice_items table worked correctly

-- 1. Check RLS status for invoice_items table
SELECT 
    relname AS table_name,
    relrowsecurity AS rls_enabled,
    relforcerowsecurity AS force_rls
FROM pg_class 
WHERE relname = 'invoice_items';

-- 2. Check existing policies on invoice_items table
SELECT 
    polname AS policy_name,
    polpermissive AS permissive,
    polcmd AS command,
    polqual AS using_clause,
    polwithcheck AS with_check_clause
FROM pg_policy 
WHERE polrelid = 'invoice_items'::regclass
ORDER BY polname;

-- 3. Try to count rows in invoice_items table (as service_role)
SELECT 
    COUNT(*) as invoice_items_count
FROM invoice_items;

-- 4. Get a few sample rows from invoice_items table
SELECT 
    id,
    invoice_id,
    description,
    quantity,
    unit_price
FROM invoice_items
LIMIT 5;

-- 5. Check if the invoice_id column properly references invoices
SELECT 
    ii.id,
    ii.invoice_id,
    i.id as invoice_exists,
    i.customer_id,
    i.generated_by
FROM invoice_items ii
LEFT JOIN invoices i ON ii.invoice_id = i.id
LIMIT 5;