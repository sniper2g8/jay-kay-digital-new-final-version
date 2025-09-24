-- Explore the actual data in invoice_items table to understand its structure

-- 1. Get a count of rows in the table
SELECT COUNT(*) as total_rows FROM invoice_items;

-- 2. Get the first 10 rows to see the structure
SELECT * FROM invoice_items LIMIT 10;

-- 3. Get column names and types from the actual table
SELECT 
    a.attname AS column_name,
    pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
    a.attnotnull AS not_null,
    a.atthasdef AS has_default
FROM pg_catalog.pg_attribute a
WHERE a.attrelid = 'invoice_items'::regclass
AND a.attnum > 0
AND NOT a.attisdropped
ORDER BY a.attnum;

-- 4. Check for any unique constraints or indexes
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_name = 'invoice_items'
ORDER BY tc.constraint_name;

-- 5. Check for any data patterns in text columns
SELECT 
    COUNT(*) as total_rows,
    COUNT(DISTINCT description) as unique_descriptions,
    MIN(description) as min_description,
    MAX(description) as max_description
FROM invoice_items
WHERE description IS NOT NULL;

-- 6. Check for numeric data patterns
SELECT 
    MIN(quantity) as min_quantity,
    MAX(quantity) as max_quantity,
    AVG(quantity) as avg_quantity,
    MIN(unit_price) as min_unit_price,
    MAX(unit_price) as max_unit_price,
    AVG(unit_price) as avg_unit_price
FROM invoice_items;