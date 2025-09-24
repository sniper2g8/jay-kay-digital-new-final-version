-- Debug if the specific invoice exists and has items

-- 1. Check if the invoice exists
SELECT 
    id,
    customer_id,
    generated_by,
    created_at
FROM invoices 
WHERE id = 'd05a5002-33f2-4219-9d1b-236d23328af2';

-- 2. Check if there are invoice items for this invoice
SELECT 
    id,
    invoice_id,
    description,
    quantity,
    unit_price
FROM invoice_items 
WHERE invoice_id = 'd05a5002-33f2-4219-9d1b-236d23328af2';

-- 3. Check the count of items
SELECT 
    COUNT(*) as item_count
FROM invoice_items 
WHERE invoice_id = 'd05a5002-33f2-4219-9d1b-236d23328af2';

-- 4. Check if there are any policies that might be blocking access
SELECT 
    polname AS policy_name,
    polpermissive AS permissive,
    polcmd AS command,
    polqual AS using_clause
FROM pg_policy 
WHERE polrelid = 'invoice_items'::regclass
ORDER BY polname;