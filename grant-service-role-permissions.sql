-- Grant all permissions directly to service role

GRANT ALL PRIVILEGES ON TABLE customers TO service_role;
GRANT ALL PRIVILEGES ON TABLE customer_statement_periods TO service_role;
GRANT ALL PRIVILEGES ON TABLE customer_statement_transactions TO service_role;
GRANT ALL PRIVILEGES ON TABLE customer_account_balances TO service_role;
GRANT ALL PRIVILEGES ON TABLE statement_settings TO service_role;