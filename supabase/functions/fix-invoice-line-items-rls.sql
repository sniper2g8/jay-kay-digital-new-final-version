-- SQL function to fix RLS policies for invoice_line_items table
CREATE OR REPLACE FUNCTION public.fix_invoice_line_items_rls()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Drop all previous, conflicting policies to ensure a clean slate
  DROP POLICY IF EXISTS "Users can view invoice line items based on role" ON "public"."invoice_line_items";
  DROP POLICY IF EXISTS "Users can view their own invoice line items" ON "public"."invoice_line_items";
  DROP POLICY IF EXISTS "Service role can manage all invoice line items" ON "public"."invoice_line_items";
  DROP POLICY IF EXISTS "Users can view invoice line items based on database role" ON "public"."invoice_line_items";
  DROP POLICY IF EXISTS "Users can view invoice line items based on appUsers role" ON "public"."invoice_line_items";
  DROP POLICY IF EXISTS "Users can insert invoice line items based on appUsers role" ON "public"."invoice_line_items";
  DROP POLICY IF EXISTS "Users can update invoice line items based on appUsers role" ON "public"."invoice_line_items";
  DROP POLICY IF EXISTS "Users can delete invoice line_items based on appUsers role" ON "public"."invoice_line_items";

  -- Ensure RLS is enabled
  ALTER TABLE "public"."invoice_line_items" ENABLE ROW LEVEL SECURITY;

  -- Create the new, definitive policy for SELECT access
  CREATE POLICY "Users can view invoice line items based on appUsers role"
  ON "public"."invoice_line_items"
  FOR SELECT
  TO authenticated
  USING (
    -- Condition 1: The user has an 'admin' or 'super_admin' role in the appUsers table.
    EXISTS (
      SELECT 1
      FROM "public"."appUsers" au
      WHERE au.id = auth.uid()
        AND au.primary_role IN ('admin', 'super_admin')
    )
    OR
    -- Condition 2: The user is the one who generated the invoice.
    EXISTS (
      SELECT 1
      FROM invoices i
      WHERE i.id = invoice_line_items.invoice_id
        AND i.generated_by = auth.uid()
    )
    OR
    -- Condition 3: The user is a service role (for backend access)
    EXISTS (
      SELECT 1
      FROM "public"."appUsers" au
      WHERE au.id = auth.uid()
        AND au.primary_role = 'service_role'
    )
  );

  -- Create policies for INSERT, UPDATE, DELETE operations
  CREATE POLICY "Users can insert invoice line items based on appUsers role"
  ON "public"."invoice_line_items"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Condition 1: The user has an 'admin' or 'super_admin' role in the appUsers table.
    EXISTS (
      SELECT 1
      FROM "public"."appUsers" au
      WHERE au.id = auth.uid()
        AND au.primary_role IN ('admin', 'super_admin')
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

  CREATE POLICY "Users can update invoice line items based on appUsers role"
  ON "public"."invoice_line_items"
  FOR UPDATE
  TO authenticated
  USING (
    -- Condition 1: The user has an 'admin' or 'super_admin' role in the appUsers table.
    EXISTS (
      SELECT 1
      FROM "public"."appUsers" au
      WHERE au.id = auth.uid()
        AND au.primary_role IN ('admin', 'super_admin')
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

  CREATE POLICY "Users can delete invoice line items based on appUsers role"
  ON "public"."invoice_line_items"
  FOR DELETE
  TO authenticated
  USING (
    -- Condition 1: The user has an 'admin' or 'super_admin' role in the appUsers table.
    EXISTS (
      SELECT 1
      FROM "public"."appUsers" au
      WHERE au.id = auth.uid()
        AND au.primary_role IN ('admin', 'super_admin')
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
END;
$function$;