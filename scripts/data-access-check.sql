-- Check if we can access data in both tables

-- Check RLS status for both tables
SELECT 
    relname AS table_name,
    relrowsecurity AS rls_enabled,
    relforcerowsecurity AS force_rls
FROM pg_class 
WHERE relname IN ('invoice_items', 'invoice_line_items');

-- Check count of rows in both tables
SELECT 'invoice_items' as table_name, COUNT(*) as row_count FROM invoice_items
UNION ALL
SELECT 'invoice_line_items' as table_name, COUNT(*) as row_count FROM invoice_line_items;

-- Check first few rows in invoice_items
SELECT * FROM invoice_items LIMIT 3;

-- Check first few rows in invoice_line_items
SELECT * FROM invoice_line_items LIMIT 3;