-- Complete Permission Fix for All Tables
-- This script grants all necessary permissions to the service role
-- and ensures proper RLS policies are in place

-- First, let's ensure all tables exist and have proper structure
-- If any tables are missing, uncomment and run the creation scripts

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant all permissions to service role for all tables
-- This should resolve the permission denied errors

-- Grant permissions on existing tables
GRANT ALL PRIVILEGES ON TABLE appUsers TO postgres;
GRANT ALL PRIVILEGES ON TABLE customers TO postgres;
GRANT ALL PRIVILEGES ON TABLE jobs TO postgres;
GRANT ALL PRIVILEGES ON TABLE invoices TO postgres;
GRANT ALL PRIVILEGES ON TABLE payments TO postgres;
GRANT ALL PRIVILEGES ON TABLE customer_statement_periods TO postgres;
GRANT ALL PRIVILEGES ON TABLE customer_statement_transactions TO postgres;
GRANT ALL PRIVILEGES ON TABLE customer_account_balances TO postgres;
GRANT ALL PRIVILEGES ON TABLE statement_settings TO postgres;
GRANT ALL PRIVILEGES ON TABLE notifications TO postgres;
GRANT ALL PRIVILEGES ON TABLE notification_preferences TO postgres;

-- Grant permissions to authenticated role as well
GRANT ALL PRIVILEGES ON TABLE appUsers TO authenticated;
GRANT ALL PRIVILEGES ON TABLE customers TO authenticated;
GRANT ALL PRIVILEGES ON TABLE jobs TO authenticated;
GRANT ALL PRIVILEGES ON TABLE invoices TO authenticated;
GRANT ALL PRIVILEGES ON TABLE payments TO authenticated;
GRANT ALL PRIVILEGES ON TABLE customer_statement_periods TO authenticated;
GRANT ALL PRIVILEGES ON TABLE customer_statement_transactions TO authenticated;
GRANT ALL PRIVILEGES ON TABLE customer_account_balances TO authenticated;
GRANT ALL PRIVILEGES ON TABLE statement_settings TO authenticated;
GRANT ALL PRIVILEGES ON TABLE notifications TO authenticated;
GRANT ALL PRIVILEGES ON TABLE notification_preferences TO authenticated;

-- Ensure service role can bypass RLS
ALTER ROLE service_role SET supabase_admin_bypass_rls = true;

-- Fix ownership if needed (all tables should be owned by postgres)
ALTER TABLE IF EXISTS appUsers OWNER TO postgres;
ALTER TABLE IF EXISTS customers OWNER TO postgres;
ALTER TABLE IF EXISTS jobs OWNER TO postgres;
ALTER TABLE IF EXISTS invoices OWNER TO postgres;
ALTER TABLE IF EXISTS payments OWNER TO postgres;
ALTER TABLE IF EXISTS customer_statement_periods OWNER TO postgres;
ALTER TABLE IF EXISTS customer_statement_transactions OWNER TO postgres;
ALTER TABLE IF EXISTS customer_account_balances OWNER TO postgres;
ALTER TABLE IF EXISTS statement_settings OWNER TO postgres;
ALTER TABLE IF EXISTS notifications OWNER TO postgres;
ALTER TABLE IF EXISTS notification_preferences OWNER TO postgres;

-- Ensure RLS is enabled on all tables
ALTER TABLE appUsers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_statement_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_statement_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_account_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE statement_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read their own profile" ON appUsers;
DROP POLICY IF EXISTS "Users can update their own profile" ON appUsers;
DROP POLICY IF EXISTS "Admins and staff can read all profiles" ON appUsers;
DROP POLICY IF EXISTS "Admins can update all profiles" ON appUsers;

DROP POLICY IF EXISTS "Users can read their own customer info" ON customers;
DROP POLICY IF EXISTS "Users can insert their own customer info" ON customers;
DROP POLICY IF EXISTS "Users can update their own customer info" ON customers;
DROP POLICY IF EXISTS "Admins and staff can read all customer info" ON customers;
DROP POLICY IF EXISTS "Admins and staff can update all customer info" ON customers;

DROP POLICY IF EXISTS "Users can read their own jobs" ON jobs;
DROP POLICY IF EXISTS "Users can insert their own jobs" ON jobs;
DROP POLICY IF EXISTS "Users can update their own jobs" ON jobs;
DROP POLICY IF EXISTS "Admins and staff can read all jobs" ON jobs;
DROP POLICY IF EXISTS "Admins and staff can update all jobs" ON jobs;

DROP POLICY IF EXISTS "Users can read their own invoices" ON invoices;
DROP POLICY IF EXISTS "Admins and staff can read all invoices" ON invoices;

DROP POLICY IF EXISTS "Users can read their own payments" ON payments;
DROP POLICY IF EXISTS "Admins and staff can read all payments" ON payments;

DROP POLICY IF EXISTS "Users can read their own statement periods" ON customer_statement_periods;
DROP POLICY IF EXISTS "Users can insert statement periods" ON customer_statement_periods;
DROP POLICY IF EXISTS "Users can update their own statement periods" ON customer_statement_periods;
DROP POLICY IF EXISTS "Admins and staff can read all statement periods" ON customer_statement_periods;
DROP POLICY IF EXISTS "Admins and staff can update all statement periods" ON customer_statement_periods;

DROP POLICY IF EXISTS "Users can read their own statement transactions" ON customer_statement_transactions;
DROP POLICY IF EXISTS "Users can insert statement transactions" ON customer_statement_transactions;
DROP POLICY IF EXISTS "Users can update their own statement transactions" ON customer_statement_transactions;
DROP POLICY IF EXISTS "Admins and staff can read all statement transactions" ON customer_statement_transactions;
DROP POLICY IF EXISTS "Admins and staff can update all statement transactions" ON customer_statement_transactions;

DROP POLICY IF EXISTS "Users can read their account balances" ON customer_account_balances;
DROP POLICY IF EXISTS "Users can update their account balances" ON customer_account_balances;
DROP POLICY IF EXISTS "Admins and staff can read all account balances" ON customer_account_balances;
DROP POLICY IF EXISTS "Admins and staff can update all account balances" ON customer_account_balances;

DROP POLICY IF EXISTS "Users can read their own statement settings" ON statement_settings;
DROP POLICY IF EXISTS "Users can update their own statement settings" ON statement_settings;
DROP POLICY IF EXISTS "Admins and staff can read all statement settings" ON statement_settings;
DROP POLICY IF EXISTS "Admins and staff can update all statement settings" ON statement_settings;

DROP POLICY IF EXISTS "Users can read their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

DROP POLICY IF EXISTS "Users can read their own preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON notification_preferences;

-- Create new policies for appUsers
CREATE POLICY "Users can read their own profile" 
ON appUsers FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON appUsers FOR UPDATE 
USING (id = auth.uid());

CREATE POLICY "Admins and staff can read all profiles" 
ON appUsers FOR SELECT 
USING ( EXISTS (
  SELECT 1 FROM appUsers a 
  WHERE a.id = auth.uid() AND a.userRole IN ('admin', 'staff')
));

CREATE POLICY "Admins can update all profiles" 
ON appUsers FOR UPDATE 
USING ( EXISTS (
  SELECT 1 FROM appUsers a 
  WHERE a.id = auth.uid() AND a.userRole = 'admin'
));

-- Create new policies for customers
CREATE POLICY "Users can read their own customer info" 
ON customers FOR SELECT 
USING (app_user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own customer info" 
ON customers FOR INSERT 
WITH CHECK (app_user_id = auth.uid()::text);

CREATE POLICY "Users can update their own customer info" 
ON customers FOR UPDATE 
USING (app_user_id = auth.uid()::text);

CREATE POLICY "Admins and staff can read all customer info" 
ON customers FOR SELECT 
USING ( EXISTS (
  SELECT 1 FROM appUsers a 
  WHERE a.id = auth.uid() AND a.userRole IN ('admin', 'staff')
));

CREATE POLICY "Admins and staff can update all customer info" 
ON customers FOR UPDATE 
USING ( EXISTS (
  SELECT 1 FROM appUsers a 
  WHERE a.id = auth.uid() AND a.userRole IN ('admin', 'staff')
));

-- Create new policies for jobs
CREATE POLICY "Users can read their own jobs" 
ON jobs FOR SELECT 
USING (customer_id = auth.uid());

CREATE POLICY "Users can insert their own jobs" 
ON jobs FOR INSERT 
WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Users can update their own jobs" 
ON jobs FOR UPDATE 
USING (customer_id = auth.uid());

CREATE POLICY "Admins and staff can read all jobs" 
ON jobs FOR SELECT 
USING ( EXISTS (
  SELECT 1 FROM appUsers a 
  WHERE a.id = auth.uid() AND a.userRole IN ('admin', 'staff')
));

CREATE POLICY "Admins and staff can update all jobs" 
ON jobs FOR UPDATE 
USING ( EXISTS (
  SELECT 1 FROM appUsers a 
  WHERE a.id = auth.uid() AND a.userRole IN ('admin', 'staff')
));

-- Create new policies for invoices
CREATE POLICY "Users can read their own invoices" 
ON invoices FOR SELECT 
USING (customer_id = auth.uid());

CREATE POLICY "Admins and staff can read all invoices" 
ON invoices FOR SELECT 
USING ( EXISTS (
  SELECT 1 FROM appUsers a 
  WHERE a.id = auth.uid() AND a.userRole IN ('admin', 'staff')
));

-- Create new policies for payments
CREATE POLICY "Users can read their own payments" 
ON payments FOR SELECT 
USING (customer_id = auth.uid());

CREATE POLICY "Admins and staff can read all payments" 
ON payments FOR SELECT 
USING ( EXISTS (
  SELECT 1 FROM appUsers a 
  WHERE a.id = auth.uid() AND a.userRole IN ('admin', 'staff')
));

-- Create new policies for statement periods
CREATE POLICY "Users can read their own statement periods" 
ON customer_statement_periods FOR SELECT 
USING (customer_id = auth.uid());

CREATE POLICY "Users can insert statement periods" 
ON customer_statement_periods FOR INSERT 
WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Users can update their own statement periods" 
ON customer_statement_periods FOR UPDATE 
USING (customer_id = auth.uid());

CREATE POLICY "Admins and staff can read all statement periods" 
ON customer_statement_periods FOR SELECT 
USING ( EXISTS (
  SELECT 1 FROM appUsers a 
  WHERE a.id = auth.uid() AND a.userRole IN ('admin', 'staff')
));

CREATE POLICY "Admins and staff can update all statement periods" 
ON customer_statement_periods FOR UPDATE 
USING ( EXISTS (
  SELECT 1 FROM appUsers a 
  WHERE a.id = auth.uid() AND a.userRole IN ('admin', 'staff')
));

-- Create new policies for statement transactions
CREATE POLICY "Users can read their own statement transactions" 
ON customer_statement_transactions FOR SELECT 
USING (customer_id = auth.uid());

CREATE POLICY "Users can insert statement transactions" 
ON customer_statement_transactions FOR INSERT 
WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Users can update their own statement transactions" 
ON customer_statement_transactions FOR UPDATE 
USING (customer_id = auth.uid());

CREATE POLICY "Admins and staff can read all statement transactions" 
ON customer_statement_transactions FOR SELECT 
USING ( EXISTS (
  SELECT 1 FROM appUsers a 
  WHERE a.id = auth.uid() AND a.userRole IN ('admin', 'staff')
));

CREATE POLICY "Admins and staff can update all statement transactions" 
ON customer_statement_transactions FOR UPDATE 
USING ( EXISTS (
  SELECT 1 FROM appUsers a 
  WHERE a.id = auth.uid() AND a.userRole IN ('admin', 'staff')
));

-- Create new policies for account balances
CREATE POLICY "Users can read their account balances" 
ON customer_account_balances FOR SELECT 
USING (customer_id = auth.uid());

CREATE POLICY "Users can update their account balances" 
ON customer_account_balances FOR UPDATE 
USING (customer_id = auth.uid());

CREATE POLICY "Admins and staff can read all account balances" 
ON customer_account_balances FOR SELECT 
USING ( EXISTS (
  SELECT 1 FROM appUsers a 
  WHERE a.id = auth.uid() AND a.userRole IN ('admin', 'staff')
));

CREATE POLICY "Admins and staff can update all account balances" 
ON customer_account_balances FOR UPDATE 
USING ( EXISTS (
  SELECT 1 FROM appUsers a 
  WHERE a.id = auth.uid() AND a.userRole IN ('admin', 'staff')
));

-- Create new policies for statement settings
CREATE POLICY "Users can read their own statement settings" 
ON statement_settings FOR SELECT 
USING (customer_id = auth.uid());

CREATE POLICY "Users can update their own statement settings" 
ON statement_settings FOR UPDATE 
USING (customer_id = auth.uid());

CREATE POLICY "Admins and staff can read all statement settings" 
ON statement_settings FOR SELECT 
USING ( EXISTS (
  SELECT 1 FROM appUsers a 
  WHERE a.id = auth.uid() AND a.userRole IN ('admin', 'staff')
));

CREATE POLICY "Admins and staff can update all statement settings" 
ON statement_settings FOR UPDATE 
USING ( EXISTS (
  SELECT 1 FROM appUsers a 
  WHERE a.id = auth.uid() AND a.userRole IN ('admin', 'staff')
));

-- Create new policies for notifications
CREATE POLICY "Users can read their own notifications" 
ON notifications FOR SELECT 
USING (recipient_id = auth.uid() OR recipient_id IS NULL);

CREATE POLICY "Users can insert notifications" 
ON notifications FOR INSERT 
WITH CHECK (recipient_id = auth.uid() OR recipient_id IS NULL);

CREATE POLICY "Users can update their own notifications" 
ON notifications FOR UPDATE 
USING (recipient_id = auth.uid());

CREATE POLICY "Users can delete their own notifications" 
ON notifications FOR DELETE 
USING (recipient_id = auth.uid());

-- Create new policies for notification preferences
CREATE POLICY "Users can read their own preferences" 
ON notification_preferences FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences" 
ON notification_preferences FOR UPDATE 
USING (user_id = auth.uid());

-- Grant usage on auth schema to service role
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT SELECT ON TABLE auth.users TO service_role;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Verify the changes
SELECT tablename, tableowner FROM pg_tables WHERE tablename IN (
  'appUsers', 'customers', 'jobs', 'invoices', 'payments',
  'customer_statement_periods', 'customer_statement_transactions', 
  'customer_account_balances', 'statement_settings',
  'notifications', 'notification_preferences'
);