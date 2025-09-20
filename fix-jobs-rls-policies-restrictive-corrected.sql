-- Alternative more restrictive policies for better security

-- Enable RLS on jobs table (if not already enabled)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Create policy for SELECT - all authenticated users can read jobs
CREATE POLICY "Users can read jobs" 
ON jobs 
FOR SELECT 
USING (true);

-- Create policy for INSERT - authenticated users can create jobs
CREATE POLICY "Users can create jobs" 
ON jobs 
FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' AND 
  (
    -- Staff can create any job
    EXISTS (
      SELECT 1 FROM "appUsers" 
      WHERE id = auth.uid() AND 
      primary_role IN ('admin', 'staff', 'manager')
    ) OR
    -- Customers can create jobs for themselves
    (customer_id = auth.uid())
  )
);

-- Create policy for UPDATE - users can update jobs they created or are assigned to
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
      primary_role IN ('admin', 'staff', 'manager')
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

-- Grant necessary permissions to the authenticated role
GRANT ALL ON TABLE jobs TO authenticated;