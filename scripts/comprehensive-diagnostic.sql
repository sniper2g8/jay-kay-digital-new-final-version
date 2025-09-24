-- Comprehensive diagnostic script for invoice tables

-- 1. Check what invoice-related tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name ILIKE '%invoice%'
ORDER BY table_name;

-- 2. Check the structure of both tables
-- invoice_items structure
SELECT 'invoice_items' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoice_items'
ORDER BY ordinal_position;

-- invoice_line_items structure
SELECT 'invoice_line_items' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoice_line_items'
ORDER BY ordinal_position;

-- 3. Check RLS status for both tables
SELECT 
    relname AS table_name,
    relrowsecurity AS rls_enabled,
    relforcerowsecurity AS force_rls
FROM pg_class 
WHERE relname IN ('invoice_items', 'invoice_line_items');

-- 4. Check existing RLS policies on both tables
-- Policies on invoice_items
SELECT 
    'invoice_items' as table_name,
    polname,
    polpermissive,
    polroles,
    polcmd,
    polqual,
    polwithcheck
FROM pg_policy 
WHERE polrelid = 'invoice_items'::regclass;

-- Policies on invoice_line_items
SELECT 
    'invoice_line_items' as table_name,
    polname,
    polpermissive,
    polroles,
    polcmd,
    polqual,
    polwithcheck
FROM pg_policy 
WHERE polrelid = 'invoice_line_items'::regclass;

-- 5. Check data counts in both tables
SELECT 'invoice_items' as table_name, COUNT(*) as row_count FROM invoice_items
UNION ALL
SELECT 'invoice_line_items' as table_name, COUNT(*) as row_count FROM invoice_line_items;

-- 6. Check first few rows in both tables
-- Sample from invoice_items
SELECT 'invoice_items' as table_name, * FROM invoice_items LIMIT 3;

-- Sample from invoice_line_items
SELECT 'invoice_line_items' as table_name, * FROM invoice_line_items LIMIT 3;

-- 7. Check foreign key relationships
-- Foreign keys for invoice_items
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'invoice_items';

-- Foreign keys for invoice_line_items
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'invoice_line_items';