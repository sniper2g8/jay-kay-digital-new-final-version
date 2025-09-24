-- Check data in both invoice tables
SELECT 'invoice_items' as table_name, COUNT(*) as row_count FROM invoice_items
UNION ALL
SELECT 'invoice_line_items' as table_name, COUNT(*) as row_count FROM invoice_line_items;

-- Check a sample of data from invoice_items
SELECT 'invoice_items' as table_name, * FROM invoice_items LIMIT 5;

-- Check a sample of data from invoice_line_items
SELECT 'invoice_line_items' as table_name, * FROM invoice_line_items LIMIT 5;

-- Check if there are any invoices that have items in invoice_items but not in invoice_line_items
SELECT 
    i.id as invoice_id,
    i.invoiceNo,
    COUNT(ii.id) as items_in_invoice_items,
    COUNT(ili.id) as items_in_invoice_line_items
FROM invoices i
LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
LEFT JOIN invoice_line_items ili ON i.id = ili.invoice_id
WHERE ii.id IS NOT NULL OR ili.id IS NOT NULL
GROUP BY i.id, i.invoiceNo
HAVING COUNT(ii.id) > 0 AND COUNT(ili.id) = 0
LIMIT 10;