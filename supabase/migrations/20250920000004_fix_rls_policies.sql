-- Migration: Fix RLS policies for all tables
-- This migration fixes the permission denied errors by properly setting up RLS policies

-- Enable RLS on all tables
ALTER TABLE IF EXISTS "appUsers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "customer_statement_periods" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "invoice_items" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (using CASCADE to handle dependencies)
DROP POLICY IF EXISTS "Users can view their own profile" ON "appUsers" CASCADE;
DROP POLICY IF EXISTS "Users can update their own profile" ON "appUsers" CASCADE;
DROP POLICY IF EXISTS "Service role can access all profiles" ON "appUsers" CASCADE;

DROP POLICY IF EXISTS "Users can view their own customer record" ON "customers" CASCADE;
DROP POLICY IF EXISTS "Admins and staff can view all customer records" ON "customers" CASCADE;
DROP POLICY IF EXISTS "Customers can update their own record" ON "customers" CASCADE;
DROP POLICY IF EXISTS "Admins and staff can update customer records" ON "customers" CASCADE;
DROP POLICY IF EXISTS "Service role full access to customers" ON "customers" CASCADE;

DROP POLICY IF EXISTS "Users can view their own jobs" ON "jobs" CASCADE;
DROP POLICY IF EXISTS "Admins and staff can view all jobs" ON "jobs" CASCADE;
DROP POLICY IF EXISTS "Customers can update their own jobs" ON "jobs" CASCADE;
DROP POLICY IF EXISTS "Admins and staff can update jobs" ON "jobs" CASCADE;
DROP POLICY IF EXISTS "Service role full access to jobs" ON "jobs" CASCADE;

DROP POLICY IF EXISTS "Users can view their own payments" ON "payments" CASCADE;
DROP POLICY IF EXISTS "Admins and staff can view all payments" ON "payments" CASCADE;
DROP POLICY IF EXISTS "Service role full access to payments" ON "payments" CASCADE;

DROP POLICY IF EXISTS "Users can view their own invoices" ON "invoices" CASCADE;
DROP POLICY IF EXISTS "Admins and staff can view all invoices" ON "invoices" CASCADE;
DROP POLICY IF EXISTS "Service role full access to invoices" ON "invoices" CASCADE;

DROP POLICY IF EXISTS "Users can view their own notifications" ON "notifications" CASCADE;
DROP POLICY IF EXISTS "Admins and staff can view all notifications" ON "notifications" CASCADE;
DROP POLICY IF EXISTS "Service role full access to notifications" ON "notifications" CASCADE;

DROP POLICY IF EXISTS "Users can view their own statement periods" ON "customer_statement_periods" CASCADE;
DROP POLICY IF EXISTS "Admins and staff can view all statement periods" ON "customer_statement_periods" CASCADE;
DROP POLICY IF EXISTS "Service role full access to statement periods" ON "customer_statement_periods" CASCADE;

DROP POLICY IF EXISTS "Users can view their own invoice items" ON "invoice_items" CASCADE;
DROP POLICY IF EXISTS "Admins and staff can view all invoice items" ON "invoice_items" CASCADE;
DROP POLICY IF EXISTS "Service role full access to invoice items" ON "invoice_items" CASCADE;

-- Create new policies for appUsers
CREATE POLICY "Users can view their own profile" ON "appUsers" FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update their own profile" ON "appUsers" FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Service role can access all profiles" ON "appUsers" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Create new policies for customers
CREATE POLICY "Users can view their own customer record" ON "customers" FOR SELECT USING (app_user_id = auth.uid()::text);
CREATE POLICY "Admins and staff can view all customer records" ON "customers" FOR SELECT USING (EXISTS (SELECT 1 FROM "appUsers" WHERE id = auth.uid() AND (primary_role = 'admin' OR primary_role = 'staff')));
CREATE POLICY "Customers can update their own record" ON "customers" FOR UPDATE USING (app_user_id = auth.uid()::text);
CREATE POLICY "Admins and staff can update customer records" ON "customers" FOR UPDATE USING (EXISTS (SELECT 1 FROM "appUsers" WHERE id = auth.uid() AND (primary_role = 'admin' OR primary_role = 'staff')));
CREATE POLICY "Service role full access to customers" ON "customers" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Create new policies for jobs
CREATE POLICY "Users can view their own jobs" ON "jobs" FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Admins and staff can view all jobs" ON "jobs" FOR SELECT USING (EXISTS (SELECT 1 FROM "appUsers" WHERE id = auth.uid() AND (primary_role = 'admin' OR primary_role = 'staff')));
CREATE POLICY "Customers can update their own jobs" ON "jobs" FOR UPDATE USING (customer_id = auth.uid());
CREATE POLICY "Admins and staff can update jobs" ON "jobs" FOR UPDATE USING (EXISTS (SELECT 1 FROM "appUsers" WHERE id = auth.uid() AND (primary_role = 'admin' OR primary_role = 'staff')));
CREATE POLICY "Service role full access to jobs" ON "jobs" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Create new policies for payments
CREATE POLICY "Users can view their own payments" ON "payments" FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Admins and staff can view all payments" ON "payments" FOR SELECT USING (EXISTS (SELECT 1 FROM "appUsers" WHERE id = auth.uid() AND (primary_role = 'admin' OR primary_role = 'staff')));
CREATE POLICY "Service role full access to payments" ON "payments" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Create new policies for invoices
CREATE POLICY "Users can view their own invoices" ON "invoices" FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Admins and staff can view all invoices" ON "invoices" FOR SELECT USING (EXISTS (SELECT 1 FROM "appUsers" WHERE id = auth.uid() AND (primary_role = 'admin' OR primary_role = 'staff')));
CREATE POLICY "Service role full access to invoices" ON "invoices" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Create new policies for notifications
CREATE POLICY "Users can view their own notifications" ON "notifications" FOR SELECT USING (recipient_id = auth.uid());
CREATE POLICY "Admins and staff can view all notifications" ON "notifications" FOR SELECT USING (EXISTS (SELECT 1 FROM "appUsers" WHERE id = auth.uid() AND (primary_role = 'admin' OR primary_role = 'staff')));
CREATE POLICY "Service role full access to notifications" ON "notifications" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Create new policies for customer_statement_periods
CREATE POLICY "Users can view their own statement periods" ON "customer_statement_periods" FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Admins and staff can view all statement periods" ON "customer_statement_periods" FOR SELECT USING (EXISTS (SELECT 1 FROM "appUsers" WHERE id = auth.uid() AND (primary_role = 'admin' OR primary_role = 'staff')));
CREATE POLICY "Service role full access to statement periods" ON "customer_statement_periods" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Create new policies for invoice_items
CREATE POLICY "Users can view their own invoice items" ON "invoice_items" FOR SELECT USING (EXISTS (SELECT 1 FROM "invoices" WHERE "invoices".id = "invoice_items".invoice_id AND "invoices".customer_id = auth.uid()));
CREATE POLICY "Admins and staff can view all invoice items" ON "invoice_items" FOR SELECT USING (EXISTS (SELECT 1 FROM "appUsers" WHERE id = auth.uid() AND (primary_role = 'admin' OR primary_role = 'staff')));
CREATE POLICY "Service role full access to invoice items" ON "invoice_items" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Grant necessary permissions to service_role
GRANT ALL ON "appUsers" TO service_role;
GRANT ALL ON "customers" TO service_role;
GRANT ALL ON "jobs" TO service_role;
GRANT ALL ON "payments" TO service_role;
GRANT ALL ON "invoices" TO service_role;
GRANT ALL ON "notifications" TO service_role;
GRANT ALL ON "customer_statement_periods" TO service_role;
GRANT ALL ON "invoice_items" TO service_role;