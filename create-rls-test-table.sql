-- Create a test table to verify RLS behavior

-- Create a simple test table
CREATE TABLE IF NOT EXISTS rls_test (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE rls_test ENABLE ROW LEVEL SECURITY;

-- Create a simple policy
CREATE POLICY "service_role_bypass_rls_test" 
ON rls_test 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON rls_test TO authenticated;
GRANT ALL ON rls_test TO service_role;