-- Test script to verify the API endpoint can access invoice items
-- This would typically be run as part of a broader test of the Next.js API route

-- 1. Check that we can access invoice items with proper joins
SELECT 
    ii.id,
    ii.description,
    ii.quantity,
    ii.unit_price,
    ii.total,
    i.id as invoice_id,
    i.invoiceNo,
    i.customerName,
    i.generated_by
FROM invoice_items ii
JOIN invoices i ON ii.invoice_id = i.id
LIMIT 10;

-- 2. Verify that we have the necessary columns for the frontend
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoice_items'
AND column_name IN ('id', 'description', 'quantity', 'unit_price', 'total', 'invoice_id')
ORDER BY ordinal_position;

-- 3. Check if there are any invoice items without a valid invoice_id
SELECT 
    COUNT(*) as orphaned_items
FROM invoice_items ii
LEFT JOIN invoices i ON ii.invoice_id = i.id
WHERE i.id IS NULL;

-- 4. Check the data types of key columns
SELECT 
    'invoice_items' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoice_items'
AND column_name IN ('id', 'invoice_id', 'description', 'quantity', 'unit_price', 'total')
ORDER BY ordinal_position;