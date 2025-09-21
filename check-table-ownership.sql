-- Check table ownership and other properties
-- This query would need to be run in the Supabase SQL editor

SELECT 
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE tablename IN ('customers', 'jobs', 'invoices', 'payments', 'customer_statement_periods', 'customer_statement_transactions', 'customer_account_balances', 'statement_settings')
ORDER BY tablename;