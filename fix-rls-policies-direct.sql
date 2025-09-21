-- Direct RLS Policy Fixes
-- Copy and paste this into the Supabase SQL Editor

-- Enable RLS on all tables
ALTER TABLE IF EXISTS "appUsers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "customer_statement_periods" ENABLE ROW LEVEL SECURITY;

-- Fix policies for appUsers
DROP POLICY IF EXISTS "Users can view their own profile" ON "appUsers";
CREATE POLICY "Users can view their own profile" ON "appUsers" FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON "appUsers";
CREATE POLICY "Users can update their own profile" ON "appUsers" FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "Service role can access all profiles" ON "appUsers";
CREATE POLICY "Service role can access all profiles" ON "appUsers" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Fix policies for customers
DROP POLICY IF EXISTS "Users can view their own customer record" ON "customers";
CREATE POLICY "Users can view their own customer record" ON "customers" FOR SELECT USING (app_user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Admins and staff can view all customer records" ON "customers";
CREATE POLICY "Admins and staff can view all customer records" ON "customers" FOR SELECT USING (EXISTS (SELECT 1 FROM "appUsers" WHERE id = auth.uid() AND (role = 'admin' OR role = 'staff')));

DROP POLICY IF EXISTS "Customers can update their own record" ON "customers";
CREATE POLICY "Customers can update their own record" ON "customers" FOR UPDATE USING (app_user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Admins and staff can update customer records" ON "customers";
CREATE POLICY "Admins and staff can update customer records" ON "customers" FOR UPDATE USING (EXISTS (SELECT 1 FROM "appUsers" WHERE id = auth.uid() AND (role = 'admin' OR role = 'staff')));

DROP POLICY IF EXISTS "Service role full access to customers" ON "customers";
CREATE POLICY "Service role full access to customers" ON "customers" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Fix policies for jobs
DROP POLICY IF EXISTS "Users can view their own jobs" ON "jobs";
CREATE POLICY "Users can view their own jobs" ON "jobs" FOR SELECT USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Admins and staff can view all jobs" ON "jobs";
CREATE POLICY "Admins and staff can view all jobs" ON "jobs" FOR SELECT USING (EXISTS (SELECT 1 FROM "appUsers" WHERE id = auth.uid() AND (role = 'admin' OR role = 'staff')));

DROP POLICY IF EXISTS "Customers can update their own jobs" ON "jobs";
CREATE POLICY "Customers can update their own jobs" ON "jobs" FOR UPDATE USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Admins and staff can update jobs" ON "jobs";
CREATE POLICY "Admins and staff can update jobs" ON "jobs" FOR UPDATE USING (EXISTS (SELECT 1 FROM "appUsers" WHERE id = auth.uid() AND (role = 'admin' OR role = 'staff')));

DROP POLICY IF EXISTS "Service role full access to jobs" ON "jobs";
CREATE POLICY "Service role full access to jobs" ON "jobs" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Fix policies for payments
DROP POLICY IF EXISTS "Users can view their own payments" ON "payments";
CREATE POLICY "Users can view their own payments" ON "payments" FOR SELECT USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Admins and staff can view all payments" ON "payments";
CREATE POLICY "Admins and staff can view all payments" ON "payments" FOR SELECT USING (EXISTS (SELECT 1 FROM "appUsers" WHERE id = auth.uid() AND (role = 'admin' OR role = 'staff')));

DROP POLICY IF EXISTS "Service role full access to payments" ON "payments";
CREATE POLICY "Service role full access to payments" ON "payments" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Fix policies for invoices
DROP POLICY IF EXISTS "Users can view their own invoices" ON "invoices";
CREATE POLICY "Users can view their own invoices" ON "invoices" FOR SELECT USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Admins and staff can view all invoices" ON "invoices";
CREATE POLICY "Admins and staff can view all invoices" ON "invoices" FOR SELECT USING (EXISTS (SELECT 1 FROM "appUsers" WHERE id = auth.uid() AND (role = 'admin' OR role = 'staff')));

DROP POLICY IF EXISTS "Service role full access to invoices" ON "invoices";
CREATE POLICY "Service role full access to invoices" ON "invoices" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Fix policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON "notifications";
CREATE POLICY "Users can view their own notifications" ON "notifications" FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins and staff can view all notifications" ON "notifications";
CREATE POLICY "Admins and staff can view all notifications" ON "notifications" FOR SELECT USING (EXISTS (SELECT 1 FROM "appUsers" WHERE id = auth.uid() AND (role = 'admin' OR role = 'staff')));

DROP POLICY IF EXISTS "Service role full access to notifications" ON "notifications";
CREATE POLICY "Service role full access to notifications" ON "notifications" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Fix policies for customer_statement_periods
DROP POLICY IF EXISTS "Users can view their own statement periods" ON "customer_statement_periods";
CREATE POLICY "Users can view their own statement periods" ON "customer_statement_periods" FOR SELECT USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Admins and staff can view all statement periods" ON "customer_statement_periods";
CREATE POLICY "Admins and staff can view all statement periods" ON "customer_statement_periods" FOR SELECT USING (EXISTS (SELECT 1 FROM "appUsers" WHERE id = auth.uid() AND (role = 'admin' OR role = 'staff')));

DROP POLICY IF EXISTS "Service role full access to statement periods" ON "customer_statement_periods";
CREATE POLICY "Service role full access to statement periods" ON "customer_statement_periods" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Grant necessary permissions to service_role
GRANT ALL ON "appUsers" TO service_role;
GRANT ALL ON "customers" TO service_role;
GRANT ALL ON "jobs" TO service_role;
GRANT ALL ON "payments" TO service_role;
GRANT ALL ON "invoices" TO service_role;
GRANT ALL ON "notifications" TO service_role;
GRANT ALL ON "customer_statement_periods" TO service_role;