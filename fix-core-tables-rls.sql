-- Fix RLS policies for core business tables

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

-- Grant necessary permissions
GRANT ALL ON customers TO authenticated;
GRANT ALL ON jobs TO authenticated;
GRANT ALL ON invoices TO authenticated;
GRANT ALL ON payments TO authenticated;