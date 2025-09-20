-- Fix for existing policies on jobs table
-- This script will drop the existing policies and create corrected ones

-- Drop existing policies (except the service role bypass)
DROP POLICY IF EXISTS "Staff can update jobs" ON jobs;
DROP POLICY IF EXISTS "Staff can create jobs" ON jobs;
DROP POLICY IF EXISTS "Admins can delete jobs" ON jobs;

-- Create corrected policy for INSERT - authenticated users can create jobs
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

-- Create corrected policy for UPDATE - users can update jobs they created or are assigned to
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

-- Create corrected policy for DELETE - only admins can delete jobs
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