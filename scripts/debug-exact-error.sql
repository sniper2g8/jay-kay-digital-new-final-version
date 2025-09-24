-- Debug the exact error by testing the specific queries that the API route runs

-- 1. Test the exact query that's failing in the API route
-- This is the query: SELECT * FROM invoice_items WHERE invoice_id = 'd05a5002-33f2-4219-9d1b-236d23328af2'
SELECT 
    *
FROM invoice_items
WHERE invoice_id = 'd05a5002-33f2-4219-9d1b-236d23328af2';

-- 2. Test with COUNT to see if it's a data issue
SELECT 
    COUNT(*) as count_result
FROM invoice_items
WHERE invoice_id = 'd05a5002-33f2-4219-9d1b-236d23328af2';

-- 3. Test with LIMIT to see if it's a large data issue
SELECT 
    id,
    invoice_id,
    description
FROM invoice_items
WHERE invoice_id = 'd05a5002-33f2-4219-9d1b-236d23328af2'
LIMIT 10;

-- 4. Check if there are any triggers on invoice_items that might be causing issues
SELECT 
    tgname,
    tgenabled
FROM pg_trigger
WHERE tgrelid = 'invoice_items'::regclass;

-- 5. Check for any functions that might be throwing errors
SELECT 
    proname,
    provolatile
FROM pg_proc
WHERE proname IN (
    SELECT tgname 
    FROM pg_trigger 
    WHERE tgrelid = 'invoice_items'::regclass
);