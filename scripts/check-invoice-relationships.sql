-- Check the relationship between invoices and invoice item tables

-- 1. Check invoices table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoices'
ORDER BY ordinal_position;

-- 2. Check if invoice_items has invoice_id column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoice_items'
AND column_name = 'invoice_id';

-- 3. Check if invoice_line_items has invoice_id column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoice_line_items'
AND column_name = 'invoice_id';

-- 4. Check sample data from invoices table
SELECT id, customer_id, generated_by FROM invoices LIMIT 5;

-- 5. Check sample data from invoice_items with invoice relationship
SELECT 
    ii.id,
    ii.invoice_id,
    i.customer_id,
    i.generated_by
FROM invoice_items ii
LEFT JOIN invoices i ON ii.invoice_id = i.id
LIMIT 5;

-- 6. Check sample data from invoice_line_items with invoice relationship
SELECT 
    ili.id,
    ili.invoice_id,
    i.customer_id,
    i.generated_by
FROM invoice_line_items ili
LEFT JOIN invoices i ON ili.invoice_id = i.id
LIMIT 5;