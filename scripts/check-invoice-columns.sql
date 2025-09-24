-- Check what columns actually exist in the invoices table

-- 1. Get all column names from invoices table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoices'
ORDER BY ordinal_position;

-- 2. Check sample data from invoices table with actual column names
SELECT 
    id,
    customer_id,
    generated_by,
    created_at
FROM invoices
LIMIT 5;

-- 3. Check if there's an invoice number column with different naming
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoices'
AND (column_name ILIKE '%invoice%' OR column_name ILIKE '%no%' OR column_name ILIKE '%number%')
ORDER BY ordinal_position;