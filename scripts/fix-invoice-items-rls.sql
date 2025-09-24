-- Fix RLS policies for invoice_items table
-- First, disable RLS temporarily
ALTER TABLE invoice_items DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow service role to read invoice items" ON invoice_items;
DROP POLICY IF EXISTS "Allow authenticated users to read own invoice items" ON invoice_items;
DROP POLICY IF EXISTS "Users can view invoice items based on appUsers role" ON invoice_items;
DROP POLICY IF EXISTS "Service role can manage all invoice items" ON invoice_items;

-- Create new policies
-- Allow service role to read all invoice items
CREATE POLICY "Allow service role to read invoice items" 
ON invoice_items 
FOR SELECT 
TO service_role 
USING (true);

-- Allow authenticated users to read their own invoice items
-- This assumes there's a user_id or similar column to identify ownership
CREATE POLICY "Allow authenticated users to read own invoice items" 
ON invoice_items 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 
        FROM invoices 
        WHERE invoices.id = invoice_items.invoice_id 
        AND invoices.generated_by = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1
        FROM appUsers au
        WHERE au.id = auth.uid()
        AND au.primary_role IN ('admin', 'super_admin', 'manager', 'staff')
    )
);

-- Re-enable RLS
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Force RLS for all users including service role
ALTER TABLE invoice_items FORCE ROW LEVEL SECURITY;
