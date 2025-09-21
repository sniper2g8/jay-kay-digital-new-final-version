-- Fix customers table RLS policies

-- Drop conflicting policies
DROP POLICY IF EXISTS "Admins and staff can view all customers" ON customers;
DROP POLICY IF EXISTS "Admins can delete customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON customers;
DROP POLICY IF EXISTS "Users can update customers" ON customers;
DROP POLICY IF EXISTS "customers_service_role_bypass" ON customers;
DROP POLICY IF EXISTS "service_role_bypass_customers" ON customers;

-- Create proper service role bypass policy
CREATE POLICY "service_role_bypass_customers" 
ON customers 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Create user policies
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

CREATE POLICY "Authenticated users can insert customers" 
ON customers 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

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

-- Grant necessary permissions
GRANT ALL ON customers TO authenticated;
GRANT ALL ON customers TO service_role;