-- Final fix for RLS policies on invoice_items table
-- This script creates proper RLS policies based on the actual table structure

-- First, ensure RLS is enabled on the invoice_items table
ALTER TABLE IF EXISTS "invoice_items" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (using CASCADE to handle dependencies)
DROP POLICY IF EXISTS "Users can view their own invoice items" ON "invoice_items" CASCADE;
DROP POLICY IF EXISTS "Admins and staff can view all invoice items" ON "invoice_items" CASCADE;
DROP POLICY IF EXISTS "Service role full access to invoice items" ON "invoice_items" CASCADE;
DROP POLICY IF EXISTS "Allow service role to read invoice items" ON "invoice_items" CASCADE;
DROP POLICY IF EXISTS "Allow authenticated users to read own invoice items" ON "invoice_items" CASCADE;

-- Create new policies for invoice_items based on the actual table structure
-- Policy 1: Users can view their own invoice items (based on invoice_id linking to invoices table)
CREATE POLICY "Users can view their own invoice items" 
ON "invoice_items" 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM "invoices" 
    WHERE "invoices"."id" = "invoice_items"."invoice_id" 
    AND (
      -- The user is the one who generated the invoice
      "invoices"."generated_by" = auth.uid()
      OR
      -- The user is the customer for the invoice
      "invoices"."customer_id" = auth.uid()
    )
  )
);

-- Policy 2: Admins and staff can view all invoice items
CREATE POLICY "Admins and staff can view all invoice items" 
ON "invoice_items" 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM "appUsers" 
    WHERE "id" = auth.uid() 
    AND "primary_role" IN ('admin', 'super_admin', 'manager', 'staff')
  )
);

-- Policy 3: Service role has full access to invoice items
CREATE POLICY "Service role full access to invoice items" 
ON "invoice_items" 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Grant necessary permissions to service_role
GRANT ALL ON "invoice_items" TO service_role;

-- Verify the policies were created
SELECT 
  polname AS policy_name,
  polpermissive AS permissive,
  polcmd AS command,
  polqual AS using_clause,
  polwithcheck AS with_check_clause
FROM pg_policy 
WHERE polrelid = 'invoice_items'::regclass
ORDER BY polname;