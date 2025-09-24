-- Debug the user role for the user making the request

-- 1. Check the user's role
SELECT 
    id,
    email,
    primary_role
FROM appUsers 
WHERE id = '337eb073-1bfd-4879-94b7-653bda239e06';

-- 2. Check if this user has admin privileges
SELECT 
    EXISTS (
        SELECT 1 
        FROM appUsers 
        WHERE id = '337eb073-1bfd-4879-94b7-653bda239e06' 
        AND primary_role IN ('admin', 'super_admin')
    ) as is_admin;

-- 3. Check if there are any policies that might affect this user
SELECT 
    polname AS policy_name,
    polpermissive AS permissive,
    polcmd AS command,
    polqual AS using_clause
FROM pg_policy 
WHERE polrelid = 'invoice_items'::regclass
ORDER BY polname;