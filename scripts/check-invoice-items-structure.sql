-- Check the structure of invoice_items table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoice_items'
ORDER BY ordinal_position;

-- Check if there are any constraints on the table
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
AND table_name = 'invoice_items';

-- Check a sample of data in the table
SELECT * FROM invoice_items LIMIT 5;

-- Check if there are any rows in the table
SELECT COUNT(*) as total_rows FROM invoice_items;

-- Check if there are any rows for a specific invoice (replace with an actual invoice ID)
-- SELECT COUNT(*) as rows_for_invoice FROM invoice_items WHERE invoice_id = 'your-invoice-id-here';