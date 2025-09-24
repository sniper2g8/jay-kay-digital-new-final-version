-- Test if service role can access invoice_items data
-- This script should be run with a user that has sufficient privileges

-- Check current session user
SELECT 
    CURRENT_USER as current_user,
    SESSION_USER as session_user,
    CURRENT_ROLE as current_role;

-- Try to count rows in invoice_items table
SELECT 
    COUNT(*) as invoice_items_count
FROM invoice_items;

-- Try to count rows in invoice_line_items table for comparison
SELECT 
    COUNT(*) as invoice_line_items_count
FROM invoice_line_items;

-- Check if we can query specific columns from invoice_items
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'invoice_items'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test a simple query with LIMIT
SELECT 
    *
FROM invoice_items
LIMIT 3;

-- Check if there are any RLS policies currently applied
SELECT 
    p.polname AS policy_name,
    p.polpermissive AS permissive,
    CASE 
        WHEN p.polroles = '{0}' THEN 'ALL'
        ELSE pg_get_userbyid(unnest(p.polroles)) 
    END AS role_name,
    p.polcmd AS command,
    pg_get_expr(p.polqual, p.polrelid) AS using_clause,
    pg_get_expr(p.polwithcheck, p.polrelid) AS with_check_clause
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'invoice_items';