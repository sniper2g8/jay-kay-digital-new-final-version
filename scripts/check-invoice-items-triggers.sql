-- Check for any triggers on the invoice_items table

-- 1. Check for triggers on invoice_items
SELECT 
    tgname AS trigger_name,
    pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgrelid = 'invoice_items'::regclass;

-- 2. Check for triggers on invoice_line_items for comparison
SELECT 
    tgname AS trigger_name,
    pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgrelid = 'invoice_line_items'::regclass;

-- 3. Check for any functions that might be related to invoice processing
SELECT 
    proname AS function_name,
    pg_get_functiondef(oid) AS function_definition
FROM pg_proc
WHERE proname ILIKE '%invoice%'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');