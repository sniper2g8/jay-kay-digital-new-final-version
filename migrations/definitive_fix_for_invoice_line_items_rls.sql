-- Final, definitive RLS policy fix for invoice_line_items
-- This version joins against the user_roles table, which is the source of truth.

-- Drop all previous, conflicting policies to ensure a clean slate
DROP POLICY IF EXISTS "Users can view invoice line items based on role" ON "public"."invoice_line_items";
DROP POLICY IF EXISTS "Users can view their own invoice line items" ON "public"."invoice_line_items";
DROP POLICY IF EXISTS "Service role can manage all invoice line items" ON "public"."invoice_line_items";

-- Ensure RLS is enabled
ALTER TABLE "public"."invoice_line_items" ENABLE ROW LEVEL SECURITY;

-- Create the new, definitive policy for SELECT access
CREATE POLICY "Users can view invoice line items based on database role"
ON "public"."invoice_line_items"
FOR SELECT
TO authenticated
USING (
  -- Condition 1: The user has an 'admin' or 'super_admin' role in the user_roles table.
  EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'super_admin')
  )
  OR
  -- Condition 2: The user is the one who generated the invoice.
  EXISTS (
    SELECT 1
    FROM invoices i
    WHERE i.id = invoice_line_items.invoice_id
      AND i.generated_by = auth.uid()
  )
);

-- Re-create the policy for ALL operations for the service_role (for backend access)
CREATE POLICY "Service role can manage all invoice line items"
ON "public"."invoice_line_items"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
