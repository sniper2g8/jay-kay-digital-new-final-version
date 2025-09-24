-- Test what the API route is trying to do by simulating the queries

-- 1. Simulate the first query (check if invoice exists)
SELECT 
    id
FROM invoices
WHERE id = 'd05a5002-33f2-4219-9d1b-236d23328af2'
LIMIT 1;

-- 2. Simulate the second query (fetch invoice items)
SELECT 
    *
FROM invoice_items
WHERE invoice_id = 'd05a5002-33f2-4219-9d1b-236d23328af2';

-- 3. Check if there are any constraints or triggers that might be causing issues
SELECT 
    tgname AS trigger_name,
    pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgrelid = 'invoice_items'::regclass;

-- 4. Check for any functions that might be related to invoice_items
SELECT 
    proname AS function_name
FROM pg_proc
WHERE proname ILIKE '%invoice%item%'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');