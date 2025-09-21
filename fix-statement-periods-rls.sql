-- First, enable RLS on the table
ALTER TABLE customer_statement_periods ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own statement periods" ON customer_statement_periods;
DROP POLICY IF EXISTS "Admins and staff can view all statement periods" ON customer_statement_periods;
DROP POLICY IF EXISTS "Users can insert statement periods" ON customer_statement_periods;
DROP POLICY IF EXISTS "Service role full access to statement periods" ON customer_statement_periods;
DROP POLICY IF EXISTS "Users can update their own statement periods" ON customer_statement_periods;

-- Create comprehensive RLS policies

-- Allow users to view their own statement periods
CREATE POLICY "Users can view their own statement periods"
ON customer_statement_periods
FOR SELECT
USING (
  customer_id::text = auth.uid()::text
  OR EXISTS (
    SELECT 1 FROM "appUsers"
    WHERE id = auth.uid()
    AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
  )
);

-- Allow admins and staff to insert statement periods
CREATE POLICY "Users can insert statement periods"
ON customer_statement_periods
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "appUsers"
    WHERE id = auth.uid()
    AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
  )
);

-- Allow users to update their own statement periods or admins to update any
CREATE POLICY "Users can update their own statement periods"
ON customer_statement_periods
FOR UPDATE
USING (
  customer_id::text = auth.uid()::text
  OR EXISTS (
    SELECT 1 FROM "appUsers"
    WHERE id = auth.uid()
    AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
  )
);

-- Allow service role full access (for server-side operations)
CREATE POLICY "Service role full access to statement periods"
ON customer_statement_periods
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);