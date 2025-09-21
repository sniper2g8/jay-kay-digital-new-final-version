-- Check and fix table permissions

-- Grant all permissions on statement tables to authenticated users
GRANT ALL ON customer_statement_periods TO authenticated;
GRANT ALL ON customer_statement_transactions TO authenticated;
GRANT ALL ON customer_account_balances TO authenticated;
GRANT ALL ON statement_settings TO authenticated;

-- Grant all permissions on statement tables to service_role
GRANT ALL ON customer_statement_periods TO service_role;
GRANT ALL ON customer_statement_transactions TO service_role;
GRANT ALL ON customer_account_balances TO service_role;
GRANT ALL ON statement_settings TO service_role;

-- Grant all permissions on statement tables to postgres (admin)
GRANT ALL ON customer_statement_periods TO postgres;
GRANT ALL ON customer_statement_transactions TO postgres;
GRANT ALL ON customer_account_balances TO postgres;
GRANT ALL ON statement_settings TO postgres;