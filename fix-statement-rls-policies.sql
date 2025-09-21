-- Fix RLS policies for customer statement tables

-- Enable RLS on all statement tables
ALTER TABLE customer_statement_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_statement_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_account_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE statement_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all statement periods" ON customer_statement_periods;
DROP POLICY IF EXISTS "Authenticated users can insert statement periods" ON customer_statement_periods;
DROP POLICY IF EXISTS "Authenticated users can update statement periods" ON customer_statement_periods;

DROP POLICY IF EXISTS "Users can view all statement transactions" ON customer_statement_transactions;
DROP POLICY IF EXISTS "Authenticated users can insert statement transactions" ON customer_statement_transactions;

DROP POLICY IF EXISTS "Users can view all account balances" ON customer_account_balances;
DROP POLICY IF EXISTS "Authenticated users can manage account balances" ON customer_account_balances;

DROP POLICY IF EXISTS "Users can view statement settings" ON statement_settings;
DROP POLICY IF EXISTS "Authenticated users can update statement settings" ON statement_settings;

-- Create proper policies for statement periods
-- Admins and staff can view all statement periods
-- Customers can only view their own statement periods
CREATE POLICY "Admins and staff can view all statement periods" 
ON customer_statement_periods 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM appUsers 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
  )
  OR customer_id = auth.uid()::text
);

-- Authenticated users can insert statement periods (for admin/staff)
CREATE POLICY "Authenticated users can insert statement periods" 
ON customer_statement_periods 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own statement periods or admins/staff can update any
CREATE POLICY "Users can update statement periods" 
ON customer_statement_periods 
FOR UPDATE 
USING (
  customer_id = auth.uid()::text
  OR EXISTS (
    SELECT 1 FROM appUsers 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
  )
);

-- Create proper policies for statement transactions
-- Users can view transactions for their own statement periods
-- Admins and staff can view all transactions
CREATE POLICY "Users can view statement transactions" 
ON customer_statement_transactions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM customer_statement_periods 
    WHERE customer_statement_periods.id = customer_statement_transactions.statement_period_id
    AND (
      customer_statement_periods.customer_id = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM appUsers 
        WHERE id = auth.uid() 
        AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
      )
    )
  )
);

-- Authenticated users can insert statement transactions (for admin/staff)
CREATE POLICY "Authenticated users can insert statement transactions" 
ON customer_statement_transactions 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Create proper policies for account balances
-- Users can view their own account balances
-- Admins and staff can view all account balances
CREATE POLICY "Users can view account balances" 
ON customer_account_balances 
FOR SELECT 
USING (
  customer_id = auth.uid()::text
  OR EXISTS (
    SELECT 1 FROM appUsers 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
  )
);

-- Authenticated users can update account balances (for admin/staff)
CREATE POLICY "Authenticated users can update account balances" 
ON customer_account_balances 
FOR UPDATE 
WITH CHECK (auth.uid() IS NOT NULL);

-- Create proper policies for statement settings
-- All authenticated users can view settings
CREATE POLICY "Users can view statement settings" 
ON statement_settings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Only admins can update settings
CREATE POLICY "Admins can update statement settings" 
ON statement_settings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM appUsers 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin')
  )
);

-- Grant necessary permissions
GRANT ALL ON customer_statement_periods TO authenticated;
GRANT ALL ON customer_statement_transactions TO authenticated;
GRANT ALL ON customer_account_balances TO authenticated;
GRANT ALL ON statement_settings TO authenticated;