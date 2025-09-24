-- Migration: Fix RLS policies for invoice_items table
-- This migration adds RLS policies for the invoice_items table

-- Enable RLS on invoice_items table
ALTER TABLE IF EXISTS "invoice_items" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (using CASCADE to handle dependencies)
DROP POLICY IF EXISTS "Users can view their own invoice items" ON "invoice_items" CASCADE;
DROP POLICY IF EXISTS "Admins and staff can view all invoice items" ON "invoice_items" CASCADE;
DROP POLICY IF EXISTS "Service role full access to invoice items" ON "invoice_items" CASCADE;

-- Create new policies for invoice_items
CREATE POLICY "Users can view their own invoice items" ON "invoice_items" FOR SELECT USING (EXISTS (SELECT 1 FROM "invoices" WHERE "invoices".id = "invoice_items".invoice_id AND "invoices".customer_id = auth.uid()));
CREATE POLICY "Admins and staff can view all invoice items" ON "invoice_items" FOR SELECT USING (EXISTS (SELECT 1 FROM "appUsers" WHERE id = auth.uid() AND (primary_role = 'admin' OR primary_role = 'staff')));
CREATE POLICY "Service role full access to invoice items" ON "invoice_items" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Grant necessary permissions to service_role
GRANT ALL ON "invoice_items" TO service_role;

-- Verify the policies were created
SELECT polname, polpermissive, polcmd, polqual, polwithcheck
FROM pg_policy 
WHERE polrelid = 'invoice_items'::regclass;