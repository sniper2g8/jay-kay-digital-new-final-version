-- Comprehensive column type check for all relevant tables
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name IN ('customers', 'jobs', 'invoices', 'payments', 'customer_statement_periods', 'customer_statement_transactions', 'customer_account_balances', 'appUsers')
AND column_name IN ('id', 'app_user_id', 'customer_id')
ORDER BY table_name, column_name;