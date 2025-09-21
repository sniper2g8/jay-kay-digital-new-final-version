-- =====================================================
-- CORE BUSINESS TABLES RLS POLICIES (WITH TYPE CASTING FIXES)
-- =====================================================

-- Enable RLS on all core business tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all customers" ON customers;
DROP POLICY IF EXISTS "Users can insert customers" ON customers;
DROP POLICY IF EXISTS "Users can update customers" ON customers;
DROP POLICY IF EXISTS "Users can delete customers" ON customers;

DROP POLICY IF EXISTS "Users can view all jobs" ON jobs;
DROP POLICY IF EXISTS "Users can insert jobs" ON jobs;
DROP POLICY IF EXISTS "Users can update jobs" ON jobs;
DROP POLICY IF EXISTS "Users can delete jobs" ON jobs;

DROP POLICY IF EXISTS "Users can view all invoices" ON invoices;
DROP POLICY IF EXISTS "Users can insert invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update invoices" ON invoices;
DROP POLICY IF EXISTS "Users can delete invoices" ON invoices;

DROP POLICY IF EXISTS "Users can view all payments" ON payments;
DROP POLICY IF EXISTS "Users can insert payments" ON payments;
DROP POLICY IF EXISTS "Users can update payments" ON payments;
DROP POLICY IF EXISTS "Users can delete payments" ON payments;

-- Service role bypass policies (allow server-side operations)
CREATE POLICY "service_role_bypass_customers" 
ON customers 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "service_role_bypass_jobs" 
ON jobs 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "service_role_bypass_invoices" 
ON invoices 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "service_role_bypass_payments" 
ON payments 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Create proper policies for customers
-- Admins and staff can view all customers
-- Customers can view their own records (if linked)
CREATE POLICY "Admins and staff can view all customers" 
ON customers 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
  )
  OR app_user_id = auth.uid()::text
);

-- Authenticated users can insert customers (for admin/staff)
CREATE POLICY "Authenticated users can insert customers" 
ON customers 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update customers they have access to
CREATE POLICY "Users can update customers" 
ON customers 
FOR UPDATE 
USING (
  app_user_id = auth.uid()::text
  OR EXISTS (
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
  )
);

-- Only admins can delete customers
CREATE POLICY "Admins can delete customers" 
ON customers 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin')
  )
);

-- Create proper policies for jobs
-- Admins and staff can view all jobs
-- Customers can view their own jobs
CREATE POLICY "Users can view jobs" 
ON jobs 
FOR SELECT 
USING (
  customer_id IN (
    SELECT id FROM customers WHERE app_user_id = auth.uid()::text
  )
  OR EXISTS (
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
  )
);

-- Authenticated users can insert jobs (for admin/staff)
CREATE POLICY "Authenticated users can insert jobs" 
ON jobs 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update jobs they have access to
CREATE POLICY "Users can update jobs" 
ON jobs 
FOR UPDATE 
USING (
  customer_id IN (
    SELECT id FROM customers WHERE app_user_id = auth.uid()::text
  )
  OR EXISTS (
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
  )
);

-- Only admins can delete jobs
CREATE POLICY "Admins can delete jobs" 
ON jobs 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin')
  )
);

-- Create proper policies for invoices
-- Admins and staff can view all invoices
-- Customers can view their own invoices
CREATE POLICY "Users can view invoices" 
ON invoices 
FOR SELECT 
USING (
  customer_id IN (
    SELECT id FROM customers WHERE app_user_id = auth.uid()::text
  )
  OR EXISTS (
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
  )
);

-- Authenticated users can insert invoices (for admin/staff)
CREATE POLICY "Authenticated users can insert invoices" 
ON invoices 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update invoices they have access to
CREATE POLICY "Users can update invoices" 
ON invoices 
FOR UPDATE 
USING (
  customer_id IN (
    SELECT id FROM customers WHERE app_user_id = auth.uid()::text
  )
  OR EXISTS (
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
  )
);

-- Only admins can delete invoices
CREATE POLICY "Admins can delete invoices" 
ON invoices 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin')
  )
);

-- Create proper policies for payments
-- Admins and staff can view all payments
-- Customers can view their own payments
CREATE POLICY "Users can view payments" 
ON payments 
FOR SELECT 
USING (
  customer_id IN (
    SELECT id FROM customers WHERE app_user_id = auth.uid()::text
  )
  OR EXISTS (
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
  )
);

-- Authenticated users can insert payments (for admin/staff)
CREATE POLICY "Authenticated users can insert payments" 
ON payments 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update payments they have access to
CREATE POLICY "Users can update payments" 
ON payments 
FOR UPDATE 
USING (
  customer_id IN (
    SELECT id FROM customers WHERE app_user_id = auth.uid()::text
  )
  OR EXISTS (
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
  )
);

-- Only admins can delete payments
CREATE POLICY "Admins can delete payments" 
ON payments 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin')
  )
);

-- =====================================================
-- STATEMENT TABLES RLS POLICIES (WITH TYPE CASTING FIXES)
-- =====================================================

-- Enable RLS on all statement tables (if they exist)
ALTER TABLE IF EXISTS customer_statement_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customer_statement_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customer_account_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS statement_settings ENABLE ROW LEVEL SECURITY;

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

-- Service role bypass policies (allow server-side operations)
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

-- Create proper policies for statement periods
-- Admins and staff can view all statement periods
-- Customers can only view their own statement periods
CREATE POLICY "Admins and staff can view all statement periods" 
ON customer_statement_periods 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM "appUsers" 
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
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
  )
);

-- Allow deletion for admins/staff
CREATE POLICY "Admins and staff can delete statement periods" 
ON customer_statement_periods 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM "appUsers" 
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
        SELECT 1 FROM "appUsers" 
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

-- Allow updates for admins/staff
CREATE POLICY "Admins and staff can update statement transactions" 
ON customer_statement_transactions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
  )
);

-- Allow deletion for admins/staff
CREATE POLICY "Admins and staff can delete statement transactions" 
ON customer_statement_transactions 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
  )
);

-- Create proper policies for account balances
-- Users can view their own account balances
-- Admins and staff can view all account balances
CREATE POLICY "Users can view account balances" 
ON customer_account_balances 
FOR SELECT 
USING (
  customer_id = auth.uid()::text
  OR EXISTS (
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
  )
);

-- Authenticated users can update account balances (for admin/staff)
CREATE POLICY "Admins and staff can update account balances" 
ON customer_account_balances 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
  )
);

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
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin')
  )
);

-- =====================================================
-- NOTIFICATION TABLES RLS POLICIES
-- =====================================================

-- Enable RLS on notifications table (if it exists)
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- Service role bypass for notifications
CREATE POLICY "service_role_bypass_notifications" 
ON notifications 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Users can read their own notifications
CREATE POLICY "Users can read their own notifications" 
ON notifications 
FOR SELECT 
USING (recipient_id = auth.uid() OR recipient_id IS NULL);

-- Users can insert notifications
CREATE POLICY "Users can insert notifications" 
ON notifications 
FOR INSERT 
WITH CHECK (recipient_id = auth.uid() OR recipient_id IS NULL);

-- Users can update their own notifications
CREATE POLICY "Users can update their own notifications" 
ON notifications 
FOR UPDATE 
USING (recipient_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications" 
ON notifications 
FOR DELETE 
USING (recipient_id = auth.uid());

-- =====================================================
-- APP USERS TABLE RLS POLICIES
-- =====================================================

-- Enable RLS on appUsers table (if it exists)
ALTER TABLE IF EXISTS "appUsers" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all users" ON "appUsers";
DROP POLICY IF EXISTS "Users can view own record" ON "appUsers";
DROP POLICY IF EXISTS "service_role_bypass_appusers" ON "appUsers";
DROP POLICY IF EXISTS "users_read_own_record" ON "appUsers";
DROP POLICY IF EXISTS "users_update_own_record" ON "appUsers";

-- Service role bypass (allows server-side operations)
CREATE POLICY "service_role_bypass_appusers" 
ON "appUsers" 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Users can view their own record
CREATE POLICY "users_read_own_record" 
ON "appUsers" 
FOR SELECT 
TO authenticated
USING (id = auth.uid());

-- Users can update their own record
CREATE POLICY "users_update_own_record" 
ON "appUsers" 
FOR UPDATE 
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- =====================================================
-- NOTIFICATION PREFERENCES TABLE RLS POLICIES
-- =====================================================

-- Enable RLS on notification_preferences table (if it exists)
ALTER TABLE IF EXISTS notification_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage own preferences" ON notification_preferences;

-- Service role bypass for notification preferences
CREATE POLICY "service_role_bypass_notification_preferences" 
ON notification_preferences 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Users can manage their own preferences
CREATE POLICY "Users can manage own preferences" 
ON notification_preferences 
FOR ALL 
USING (user_id = auth.uid());

-- =====================================================
-- GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT ALL ON customers TO authenticated;
GRANT ALL ON jobs TO authenticated;
GRANT ALL ON invoices TO authenticated;
GRANT ALL ON payments TO authenticated;
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON "appUsers" TO authenticated;
GRANT ALL ON notification_preferences TO authenticated;
GRANT ALL ON customer_statement_periods TO authenticated;
GRANT ALL ON customer_statement_transactions TO authenticated;
GRANT ALL ON customer_account_balances TO authenticated;
GRANT ALL ON statement_settings TO authenticated;