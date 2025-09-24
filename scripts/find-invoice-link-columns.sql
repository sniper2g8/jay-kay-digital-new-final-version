-- Find columns that might be used to link invoice items to invoices

-- 1. Check all columns in invoice_items that might reference invoices
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoice_items'
AND (column_name ILIKE '%invoice%' OR column_name ILIKE '%ref%' OR column_name ILIKE '%fk%')
ORDER BY ordinal_position;

-- 2. Check all columns in invoice_line_items that might reference invoices
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoice_line_items'
AND (column_name ILIKE '%invoice%' OR column_name ILIKE '%ref%' OR column_name ILIKE '%fk%')
ORDER BY ordinal_position;

-- 3. Look for UUID columns that might be foreign keys in invoice_items
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoice_items'
AND data_type = 'uuid'
ORDER BY ordinal_position;

-- 4. Look for UUID columns that might be foreign keys in invoice_line_items
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoice_line_items'
AND data_type = 'uuid'
ORDER BY ordinal_position;

-- 5. Check for any columns with 'id' in the name in invoice_items
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoice_items'
AND column_name ILIKE '%id%'
ORDER BY ordinal_position;

-- 6. Check for any columns with 'id' in the name in invoice_line_items
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoice_line_items'
AND column_name ILIKE '%id%'
ORDER BY ordinal_position;