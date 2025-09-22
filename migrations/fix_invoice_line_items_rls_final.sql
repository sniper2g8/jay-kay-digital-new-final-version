-- Fix RLS policies for invoice_line_items table
ALTER TABLE "public"."invoice_line_items" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own invoice line items" ON "public"."invoice_line_items";
DROP POLICY IF EXISTS "Service role can manage all invoice line items" ON "public"."invoice_line_items";

-- Allow authenticated users to view invoice line items
CREATE POLICY "Users can view their own invoice line items"
ON "public"."invoice_line_items"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_line_items.invoice_id
    AND (
      i.generated_by = auth.uid()
      OR 
      auth.uid() IN (
        SELECT user_id FROM user_roles
        WHERE role = 'admin'
      )
    )
  )
);

-- Allow service role to manage all invoice line items
CREATE POLICY "Service role can manage all invoice line items"
ON "public"."invoice_line_items"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);