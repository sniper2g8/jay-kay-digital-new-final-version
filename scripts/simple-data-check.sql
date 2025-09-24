-- Simple check to see if we can access data in invoice_items table
SELECT 
    COUNT(*) as total_items
FROM invoice_items;

-- Check first few rows to see what data exists
SELECT 
    *
FROM invoice_items
LIMIT 5;

-- Check if we can access data in invoice_line_items table for comparison
SELECT 
    COUNT(*) as total_line_items
FROM invoice_line_items;

-- Check first few rows in invoice_line_items table
SELECT 
    *
FROM invoice_line_items
LIMIT 5;