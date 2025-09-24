-- Debug the specific invoice that's causing issues

-- 1. Check if the invoice exists
SELECT 
    id,
    customer_id,
    generated_by,
    created_at
FROM invoices
WHERE id = 'd05a5002-33f2-4219-9d1b-236d23328af2';

-- 2. Check if there are items for this invoice
SELECT 
    id,
    invoice_id,
    description,
    quantity,
    unit_price,
    total
FROM invoice_items
WHERE invoice_id = 'd05a5002-33f2-4219-9d1b-236d23328af2';

-- 3. Check the count
SELECT 
    COUNT(*) as item_count
FROM invoice_items
WHERE invoice_id = 'd05a5002-33f2-4219-9d1b-236d23328af2';

-- 4. Check if there are any NULL values that might cause issues
SELECT 
    COUNT(*) as total_items,
    COUNT(invoice_id) as non_null_invoice_id,
    COUNT(description) as non_null_description,
    COUNT(quantity) as non_null_quantity,
    COUNT(unit_price) as non_null_unit_price
FROM invoice_items
WHERE invoice_id = 'd05a5002-33f2-4219-9d1b-236d23328af2';