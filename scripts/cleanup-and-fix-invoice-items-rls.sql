-- Cleanup and fix RLS policies for invoice_items table
-- This script will clean up any conflicting policies and execute the existing fix function

-- 1. First, disable RLS temporarily to avoid conflicts
ALTER TABLE "public"."invoice_items" DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies on invoice_items to ensure clean slate
DROP POLICY IF EXISTS "Users can view invoice items based on role" ON "public"."invoice_items" CASCADE;
DROP POLICY IF EXISTS "Users can view their own invoice items" ON "public"."invoice_items" CASCADE;
DROP POLICY IF EXISTS "Service role can manage all invoice items" ON "public"."invoice_items" CASCADE;
DROP POLICY IF EXISTS "Users can view invoice items based on database role" ON "public"."invoice_items" CASCADE;
DROP POLICY IF EXISTS "Users can view invoice items based on appUsers role" ON "public"."invoice_items" CASCADE;
DROP POLICY IF EXISTS "Users can insert invoice items based on appUsers role" ON "public"."invoice_items" CASCADE;
DROP POLICY IF EXISTS "Users can update invoice items based on appUsers role" ON "public"."invoice_items" CASCADE;
DROP POLICY IF EXISTS "Users can delete invoice items based on appUsers role" ON "public"."invoice_items" CASCADE;
DROP POLICY IF EXISTS "Users can view all invoice line items" ON "public"."invoice_items" CASCADE;
DROP POLICY IF EXISTS "Authenticated users can manage invoice line items" ON "public"."invoice_items" CASCADE;
DROP POLICY IF EXISTS "Users can view invoice items" ON "public"."invoice_items" CASCADE;
DROP POLICY IF EXISTS "Authenticated users can manage invoice items" ON "public"."invoice_items" CASCADE;
DROP POLICY IF EXISTS "Allow service role to read invoice items" ON "public"."invoice_items" CASCADE;
DROP POLICY IF EXISTS "Allow authenticated users to read own invoice items" ON "public"."invoice_items" CASCADE;
DROP POLICY IF EXISTS "Service role full access to invoice items" ON "public"."invoice_items" CASCADE;
DROP POLICY IF EXISTS "Admins and staff can view all invoice items" ON "public"."invoice_items" CASCADE;

-- 3. Re-enable RLS
ALTER TABLE "public"."invoice_items" ENABLE ROW LEVEL SECURITY;

-- 4. Execute the existing fix function
SELECT public.fix_invoice_items_rls();

-- 5. Verify the policies were created correctly
SELECT 
    polname AS policy_name,
    polpermissive AS permissive,
    polcmd AS command,
    polqual AS using_clause,
    polwithcheck AS with_check_clause
FROM pg_policy 
WHERE polrelid = 'invoice_items'::regclass
ORDER BY polname;

-- 6. Check RLS status
SELECT 
    relname AS table_name,
    relrowsecurity AS rls_enabled,
    relforcerowsecurity AS force_rls
FROM pg_class 
WHERE relname = 'invoice_items';

-- 7. Test access to the table
SELECT 
    COUNT(*) as invoice_items_count
FROM invoice_items;

-- 8. Check a few sample rows
SELECT 
    id,
    invoice_id,
    description,
    quantity,
    unit_price
FROM invoice_items
LIMIT 5;