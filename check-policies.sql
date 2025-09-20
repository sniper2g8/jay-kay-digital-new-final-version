-- Check if RLS is enabled on notifications table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'notifications' AND schemaname = 'public';

-- Check policies on notifications table
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policy 
JOIN pg_class ON pg_policy.polrelid = pg_class.oid 
WHERE pg_class.relname = 'notifications';

-- Check table privileges
SELECT grantee, privilege_type 
FROM information_schema.table_privileges 
WHERE table_name = 'notifications' AND table_schema = 'public';