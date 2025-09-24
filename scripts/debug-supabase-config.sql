-- Debug Supabase configuration issues

-- 1. Check if there are any row level security policies that might be too restrictive
SELECT 
    polname AS policy_name,
    polpermissive AS permissive,
    polcmd AS command,
    polqual AS using_clause,
    polwithcheck AS with_check_clause
FROM pg_policy
WHERE polrelid = 'invoice_items'::regclass;

-- 2. Check if there are any policies on the invoices table that might affect access
SELECT 
    polname AS policy_name,
    polpermissive AS permissive,
    polcmd AS command,
    polqual AS using_clause
FROM pg_policy
WHERE polrelid = 'invoices'::regclass;

-- 3. Check the current user context (this might not work in SQL editor)
SELECT 
    current_user,
    session_user;

-- 4. Check if we can access the auth schema
SELECT 
    has_schema_privilege('auth', 'usage') as can_use_auth_schema;

-- 5. Check if the auth.uid() function exists
SELECT 
    proname,
    pronamespace::regnamespace
FROM pg_proc
WHERE proname = 'uid'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth');