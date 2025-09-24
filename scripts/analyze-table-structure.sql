-- Analyze the complete structure of invoice-related tables

-- 1. Get complete structure of invoices table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    is_identity
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoices'
ORDER BY ordinal_position;

-- 2. Get complete structure of invoice_items table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    is_identity
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoice_items'
ORDER BY ordinal_position;

-- 3. Get complete structure of invoice_line_items table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    is_identity
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoice_line_items'
ORDER BY ordinal_position;

-- 4. Check if there are any views related to invoices
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name ILIKE '%invoice%'
ORDER BY table_name;

-- 5. Check for any functions related to invoices
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name ILIKE '%invoice%'
ORDER BY routine_name;