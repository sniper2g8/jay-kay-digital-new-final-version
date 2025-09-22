-- Fix RLS policies for invoice_items table
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all invoice line items" ON invoice_items;
DROP POLICY IF EXISTS "Authenticated users can manage invoice line items" ON invoice_items;

-- Create proper RLS policies for invoice_items
CREATE POLICY "Users can view invoice items"
  ON invoice_items
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage invoice items"
  ON invoice_items
  FOR ALL
  USING (auth.role() IN ('staff', 'manager', 'admin', 'super_admin'));

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON invoice_items TO authenticated;