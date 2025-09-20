-- Enable RLS on jobs table (if not already enabled)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Create policy for SELECT - all authenticated users can read jobs
CREATE POLICY "Users can read jobs" 
ON jobs 
FOR SELECT 
USING (true);

-- Create policy for INSERT - authenticated users can create jobs
CREATE POLICY "Staff can create jobs" 
ON jobs 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Create policy for UPDATE - authenticated users can update jobs
CREATE POLICY "Staff can update jobs" 
ON jobs 
FOR UPDATE 
USING (auth.role() = 'authenticated');

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