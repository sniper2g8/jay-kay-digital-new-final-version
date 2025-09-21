-- Check column types for all relevant tables
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('customers', 'jobs', 'invoices', 'payments', 'customer_statement_periods', 'customer_statement_transactions', 'customer_account_balances')
AND column_name IN ('app_user_id', 'customer_id')
ORDER BY table_name, column_name;