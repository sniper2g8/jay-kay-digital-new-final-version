-- Check current RLS status and policies for invoice_items table
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

-- Check if RLS is enabled on invoice_line_items table for comparison
SELECT 
    relname AS table_name,
    relrowsecurity AS rls_enabled,
    relforcerowsecurity AS force_rls
FROM pg_class 
WHERE relname = 'invoice_line_items';

-- Check existing policies on invoice_line_items table
SELECT 
    polname,
    polpermissive,
    polroles,
    polcmd,
    polqual,
    polwithcheck
FROM pg_policy 
WHERE polrelid = 'invoice_line_items'::regclass;