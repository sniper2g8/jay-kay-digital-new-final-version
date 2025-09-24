-- Check the specific relationships between invoices and invoice item tables

-- 1. Check invoices table structure for key columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoices'
AND column_name IN ('id', 'customer_id', 'generated_by')
ORDER BY ordinal_position;

-- 2. Check if invoice_items has invoice_id column and its properties
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoice_items'
AND column_name = 'invoice_id';

-- 3. Check if invoice_line_items has invoice_id column and its properties
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoice_line_items'
AND column_name = 'invoice_id';

-- 4. Check foreign key constraints for invoice_items
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
AND tc.table_name = 'invoice_items';

-- 5. Check foreign key constraints for invoice_line_items
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
AND tc.table_name = 'invoice_line_items';

-- 6. Check sample data from invoices table with key columns
SELECT id, customer_id, generated_by 
FROM invoices 
LIMIT 5;

-- 7. Check sample data from invoice_items with potential relationship columns
SELECT * 
FROM invoice_items 
LIMIT 5;

-- 8. Check sample data from invoice_line_items with potential relationship columns
SELECT * 
FROM invoice_line_items 
LIMIT 5;