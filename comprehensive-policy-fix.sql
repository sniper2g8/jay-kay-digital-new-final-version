-- Comprehensive fix for jobs table policies
-- This script will drop all existing policies and create corrected ones

-- Drop all existing policies on jobs table
DROP POLICY IF EXISTS "Users can read jobs" ON jobs;
DROP POLICY IF EXISTS "Staff can create jobs" ON jobs;
DROP POLICY IF EXISTS "Staff can update jobs" ON jobs;
DROP POLICY IF EXISTS "Admins can delete jobs" ON jobs;
DROP POLICY IF EXISTS "jobs_service_role_bypass" ON jobs;

-- Create policy for SELECT - all authenticated users can read jobs
CREATE POLICY "Users can read jobs" 
ON jobs 
FOR SELECT 
USING (true);

-- Create policy for INSERT - authenticated staff can create jobs
CREATE POLICY "Staff can create jobs" 
ON jobs 
FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() AND 
    primary_role IN ('admin', 'staff', 'manager', 'super_admin')
  )
);

-- Create policy for UPDATE - users can update jobs they have access to
CREATE POLICY "Users can update jobs" 
ON jobs 
FOR UPDATE 
USING (
  auth.role() = 'authenticated' AND 
  (
    -- Staff can update any job
    EXISTS (
      SELECT 1 FROM "appUsers" 
      WHERE id = auth.uid() AND 
      primary_role IN ('admin', 'staff', 'manager', 'super_admin')
    ) OR
    -- Customers can update their own jobs
    (customer_id = auth.uid()) OR
    -- Assigned users can update jobs
    (assigned_to = auth.uid())
  )
);

-- Create policy for DELETE - only admins can delete jobs
CREATE POLICY "Admins can delete jobs" 
ON jobs 
FOR DELETE 
USING (
  auth.role() = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() AND 
    primary_role IN ('admin', 'super_admin')
  )
);

-- Keep the service role bypass for backend operations
CREATE POLICY "jobs_service_role_bypass" 
ON jobs 
FOR ALL 
USING ( auth.role() = 'service_role' )
WITH CHECK ( auth.role() = 'service_role' );