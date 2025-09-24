-- Check what invoice-related tables exist in the database
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name ILIKE '%invoice%';

-- Check the structure of invoice_line_items table if it exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoice_line_items'
ORDER BY ordinal_position;

-- Check the structure of invoice_items table if it exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoice_items'
ORDER BY ordinal_position;

-- Check existing RLS policies on invoice_line_items
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policy
WHERE polrelid = 'invoice_line_items'::regclass;

-- Check existing RLS policies on invoice_items
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policy
WHERE polrelid = 'invoice_items'::regclass;