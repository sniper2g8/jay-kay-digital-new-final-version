-- Temporarily disable RLS on problematic tables to isolate the issue

ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE customer_statement_periods DISABLE ROW LEVEL SECURITY;
ALTER TABLE customer_statement_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE customer_account_balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE statement_settings DISABLE ROW LEVEL SECURITY;

-- Test access
SELECT COUNT(*) FROM notifications LIMIT 1;
SELECT COUNT(*) FROM "appUsers" LIMIT 1;
SELECT COUNT(*) FROM "notification_preferences" LIMIT 1;

-- Re-enable RLS after testing
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "appUsers" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "notification_preferences" ENABLE ROW LEVEL SECURITY;