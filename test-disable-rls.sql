-- Simple test to check RLS behavior

-- First, let's disable RLS completely on the statement periods table
ALTER TABLE customer_statement_periods DISABLE ROW LEVEL SECURITY;

-- Test access
-- (This would need to be done through the Supabase dashboard)

-- Then re-enable RLS
-- ALTER TABLE customer_statement_periods ENABLE ROW LEVEL SECURITY;