-- Debug current RLS status and policies on invoice_items table

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
    polroles AS roles,
    polqual AS using_clause
FROM pg_policy 
WHERE polrelid = 'invoice_items'::regclass
ORDER BY polname;

-- 3. Check if we can access data as service role
SELECT 
    COUNT(*) as invoice_items_count
FROM invoice_items;

-- 4. Check a specific invoice ID that's failing
SELECT 
    COUNT(*) as specific_invoice_count
FROM invoice_items 
WHERE invoice_id = 'd05a5002-33f2-4219-9d1b-236d23328af2';

-- 5. Check if the invoice exists
SELECT 
    id,
    customer_id,
    generated_by
FROM invoices 
WHERE id = 'd05a5002-33f2-4219-9d1b-236d23328af2';