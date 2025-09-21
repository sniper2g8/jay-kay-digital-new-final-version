-- Check column types for appUsers table
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'appUsers' 
AND column_name = 'id'
ORDER BY table_name, column_name;