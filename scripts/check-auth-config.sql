-- Check auth configuration and related settings

-- Check if the auth schema exists and what tables it contains
SELECT 
    table_schema,
    table_name
FROM information_schema.tables
WHERE table_schema = 'auth'
ORDER BY table_name;

-- Check auth.users table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'auth' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- Check if there are any auth-related extensions
SELECT 
    name,
    default_version,
    installed_version,
    comment
FROM pg_available_extensions
WHERE name LIKE '%auth%' OR name LIKE '%supabase%';

-- Check current database settings related to authentication
SELECT 
    name,
    setting,
    short_desc
FROM pg_settings
WHERE name LIKE '%auth%' OR name LIKE '%role%' OR name LIKE '%security%'
ORDER BY name;

-- Check if the auth.uid() function exists
SELECT 
    proname,
    proargtypes,
    prorettype
FROM pg_proc
WHERE proname = 'uid'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth');

-- Check if we have access to the auth schema
SELECT 
    has_schema_privilege('auth', 'usage') as can_use_auth_schema,
    has_table_privilege('auth.users', 'select') as can_select_auth_users;

-- Check current session settings
SHOW ALL LIKE '%role%';