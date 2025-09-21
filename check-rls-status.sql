-- Check if RLS is enabled and what policies exist
SELECT 
  tbl.relname AS table_name,
  tbl.relrowsecurity AS rls_enabled,
  pol.polname AS policy_name,
  pol.polcmd AS policy_command,
  pol.polroles AS policy_roles
FROM pg_class tbl
LEFT JOIN pg_policy pol ON pol.polrelid = tbl.oid
WHERE tbl.relname IN ('customers', 'jobs', 'invoices', 'payments', 'customer_statement_periods', 'customer_statement_transactions', 'customer_account_balances', 'statement_settings')
AND tbl.relkind = 'r'
ORDER BY tbl.relname, pol.polname;