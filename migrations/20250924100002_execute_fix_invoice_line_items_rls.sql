-- Execute the function to fix RLS policies for invoice_line_items table
SELECT public.fix_invoice_line_items_rls();