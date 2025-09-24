-- Check the generated_by field in invoices table to understand data structure

-- 1. Check how many invoices have NULL generated_by
SELECT 
    COUNT(*) as total_invoices,
    COUNT(generated_by) as invoices_with_generated_by,
    COUNT(*) - COUNT(generated_by) as invoices_without_generated_by
FROM invoices;

-- 2. Check sample invoices with and without generated_by
SELECT 
    id,
    customer_id,
    generated_by,
    created_at
FROM invoices
WHERE generated_by IS NOT NULL
LIMIT 5;

-- 3. Check sample invoices without generated_by
SELECT 
    id,
    customer_id,
    generated_by,
    created_at
FROM invoices
WHERE generated_by IS NULL
LIMIT 5;

-- 4. Check if there are other columns that might indicate invoice ownership
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoices'
AND (column_name ILIKE '%user%' OR column_name ILIKE '%owner%' OR column_name ILIKE '%created%')
ORDER BY ordinal_position;

-- 5. Check the structure of the appUsers table to understand role-based access
SELECT 
    id,
    email,
    primary_role
FROM appUsers
LIMIT 10;