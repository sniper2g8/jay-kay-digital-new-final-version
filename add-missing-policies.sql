-- Add missing INSERT and DELETE policies to jobs table

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