-- Check for any conflicting or duplicate policies on invoice_items table

-- 1. List all existing policies on invoice_items
SELECT 
    polname AS policy_name,
    polpermissive AS permissive,
    polroles AS roles,
    polcmd AS command,
    polqual AS using_clause,
    polwithcheck AS with_check_clause
FROM pg_policy 
WHERE polrelid = 'invoice_items'::regclass
ORDER BY polname;

-- 2. Check if RLS is enabled
SELECT 
    relname AS table_name,
    relrowsecurity AS rls_enabled,
    relforcerowsecurity AS force_rls
FROM pg_class 
WHERE relname = 'invoice_items';

-- 3. Check for any policies with similar names that might conflict
SELECT 
    polname AS policy_name,
    polrelid::regclass AS table_name
FROM pg_policy 
WHERE polname ILIKE '%invoice%item%'
ORDER BY polname;

-- 4. Check for any policies on invoice_line_items for comparison
SELECT 
    polname AS policy_name,
    polpermissive AS permissive,
    polroles AS roles,
    polcmd AS command,
    polqual AS using_clause,
    polwithcheck AS with_check_clause
FROM pg_policy 
WHERE polrelid = 'invoice_line_items'::regclass
ORDER BY polname;