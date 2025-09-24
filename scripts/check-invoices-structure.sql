-- Check the structure of the invoices table to understand linking

-- 1. Get key columns from invoices table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoices'
AND column_name IN ('id', 'customer_id', 'generated_by')
ORDER BY ordinal_position;

-- 2. Check all UUID columns in invoices table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoices'
AND data_type = 'uuid'
ORDER BY ordinal_position;

-- 3. Check foreign key relationships for invoices table
SELECT
    tc.constraint_name,
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
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'invoices'
ORDER BY tc.constraint_name;

-- 4. Check sample data from invoices table
SELECT 
    id,
    customer_id,
    generated_by
FROM invoices
LIMIT 5;