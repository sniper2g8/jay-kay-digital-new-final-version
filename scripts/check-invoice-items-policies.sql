-- Check if invoice_items table has RLS enabled
SELECT 
    relname AS table_name,
    relrowsecurity AS rls_enabled,
    relforcerowsecurity AS force_rls
FROM pg_class 
WHERE relname = 'invoice_items';

-- Check if there are any policies on invoice_items table
SELECT 
    polname,
    polpermissive,
    polroles,
    polcmd,
    polqual,
    polwithcheck
FROM pg_policy 
WHERE polrelid = 'invoice_items'::regclass;

-- Check if invoice_line_items table has RLS enabled (for comparison)
SELECT 
    relname AS table_name,
    relrowsecurity AS rls_enabled,
    relforcerowsecurity AS force_rls
FROM pg_class 
WHERE relname = 'invoice_line_items';

-- Check policies on invoice_line_items table (for comparison)
SELECT 
    polname,
    polpermissive,
    polroles,
    polcmd,
    polqual,
    polwithcheck
FROM pg_policy 
WHERE polrelid = 'invoice_line_items'::regclass;