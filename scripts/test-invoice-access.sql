-- Test if we can access invoice_items with service role
SET LOCAL role service_role;

-- Try to select from invoice_items
SELECT COUNT(*) FROM invoice_items;

-- Try to select specific invoice items
SELECT * FROM invoice_items LIMIT 5;

-- Reset role
RESET role;