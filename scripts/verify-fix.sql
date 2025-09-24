-- Verify that the fix worked by checking if we can access invoice_items data

-- Check current RLS status for invoice_items table
SELECT 
    relname AS table_name,
    relrowsecurity AS rls_enabled,
    relforcerowsecurity AS force_rls
FROM pg_class 
WHERE relname = 'invoice_items';

-- Check existing policies on invoice_items table
SELECT 
    polname,
    polpermissive,
    polroles,
    polcmd,
    polqual,
    polwithcheck
FROM pg_policy 
WHERE polrelid = 'invoice_items'::regclass;

-- Try to count rows in invoice_items table
SELECT 
    COUNT(*) as invoice_items_count
FROM invoice_items;

-- Try to get a few sample rows from invoice_items table
SELECT 
    *
FROM invoice_items
LIMIT 5;