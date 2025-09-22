-- Final RLS policy fix for invoice_line_items
-- This version uses auth.jwt() to reliably get the user's role

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own invoice line items" ON "public"."invoice_line_items";
DROP POLICY IF EXISTS "Service role can manage all invoice line items" ON "public"."invoice_line_items";

-- Enable RLS on the table if it's not already
ALTER TABLE "public"."invoice_line_items" ENABLE ROW LEVEL SECURITY;

-- Create a new, more reliable policy for SELECT access
CREATE POLICY "Users can view invoice line items based on role"
ON "public"."invoice_line_items"
FOR SELECT
TO authenticated
USING (
  -- Condition 1: User is an admin
  ((auth.jwt() -> 'user_metadata') ->> 'role' = 'admin')
  OR
  -- Condition 2: User is the one who generated the invoice
  EXISTS (
    SELECT 1
    FROM invoices i
    WHERE i.id = invoice_line_items.invoice_id
      AND i.generated_by = auth.uid()
  )
);

-- Create a policy for ALL operations for service_role (backend access)
CREATE POLICY "Service role can manage all invoice line items"
ON "public"."invoice_line_items"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
