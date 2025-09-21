-- Apply policy fixes for statement tables

-- First, let's enable the http extension if it's not already enabled
CREATE EXTENSION IF NOT EXISTS http;

-- Drop conflicting policies
DROP POLICY IF EXISTS "Admins and staff can delete statement periods" ON customer_statement_periods;
DROP POLICY IF EXISTS "Admins and staff can view all statement periods" ON customer_statement_periods;
DROP POLICY IF EXISTS "Authenticated users can insert statement periods" ON customer_statement_periods;
DROP POLICY IF EXISTS "Users can update statement periods" ON customer_statement_periods;
DROP POLICY IF EXISTS "service_role_bypass_statement_periods" ON customer_statement_periods;

-- Recreate the service role bypass policy with a simpler definition
CREATE POLICY "service_role_bypass_statement_periods" 
ON customer_statement_periods 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Recreate other policies
CREATE POLICY "Admins and staff can view all statement periods" 
ON customer_statement_periods 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
  )
  OR customer_id = auth.uid()
);

CREATE POLICY "Authenticated users can insert statement periods" 
ON customer_statement_periods 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update statement periods" 
ON customer_statement_periods 
FOR UPDATE 
USING (
  customer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
  )
);

CREATE POLICY "Admins and staff can delete statement periods" 
ON customer_statement_periods 
FOR DELETE 
USING (
  customer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
  )
);