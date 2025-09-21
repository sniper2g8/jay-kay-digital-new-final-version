-- Complete reset and fix for statement table RLS policies

-- Disable RLS temporarily
ALTER TABLE customer_statement_periods DISABLE ROW LEVEL SECURITY;
ALTER TABLE customer_statement_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE customer_account_balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE statement_settings DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Admins and staff can delete statement periods" ON customer_statement_periods;
DROP POLICY IF EXISTS "Admins and staff can view all statement periods" ON customer_statement_periods;
DROP POLICY IF EXISTS "Authenticated users can insert statement periods" ON customer_statement_periods;
DROP POLICY IF EXISTS "Users can update statement periods" ON customer_statement_periods;
DROP POLICY IF EXISTS "service_role_bypass_statement_periods" ON customer_statement_periods;

DROP POLICY IF EXISTS "Admins and staff can delete statement transactions" ON customer_statement_transactions;
DROP POLICY IF EXISTS "Admins and staff can update statement transactions" ON customer_statement_transactions;
DROP POLICY IF EXISTS "Authenticated users can insert statement transactions" ON customer_statement_transactions;
DROP POLICY IF EXISTS "Users can view statement transactions" ON customer_statement_transactions;
DROP POLICY IF EXISTS "service_role_bypass_statement_transactions" ON customer_statement_transactions;

DROP POLICY IF EXISTS "Admins and staff can update account balances" ON customer_account_balances;
DROP POLICY IF EXISTS "Users can view account balances" ON customer_account_balances;
DROP POLICY IF EXISTS "service_role_bypass_account_balances" ON customer_account_balances;

DROP POLICY IF EXISTS "Admins can update statement settings" ON statement_settings;
DROP POLICY IF EXISTS "Users can view statement settings" ON statement_settings;
DROP POLICY IF EXISTS "service_role_bypass_statement_settings" ON statement_settings;

-- Re-enable RLS
ALTER TABLE customer_statement_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_statement_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_account_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE statement_settings ENABLE ROW LEVEL SECURITY;

-- Create simplified policies that should work
CREATE POLICY "service_role_bypass_statement_periods" 
ON customer_statement_periods 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "service_role_bypass_statement_transactions" 
ON customer_statement_transactions 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "service_role_bypass_account_balances" 
ON customer_account_balances 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "service_role_bypass_statement_settings" 
ON statement_settings 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON customer_statement_periods TO authenticated;
GRANT ALL ON customer_statement_transactions TO authenticated;
GRANT ALL ON customer_account_balances TO authenticated;
GRANT ALL ON statement_settings TO authenticated;