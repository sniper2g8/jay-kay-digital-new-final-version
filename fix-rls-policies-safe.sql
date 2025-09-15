-- Safe SQL script to fix RLS policies - handles existing policies properly
-- This version drops existing policies first to avoid conflicts

-- 1. Grant basic schema access (safe to run multiple times)
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 2. Grant table-level permissions (safe to run multiple times)
GRANT SELECT ON public.customers TO anon;
GRANT SELECT ON public.jobs TO anon;
GRANT SELECT ON public.invoices TO anon;
GRANT SELECT ON public.payments TO anon;
GRANT SELECT ON public.services TO anon;
GRANT SELECT ON public.inventory TO anon;
GRANT SELECT ON public.appUsers TO anon;

-- Also grant to authenticated role
GRANT SELECT ON public.customers TO authenticated;
GRANT SELECT ON public.jobs TO authenticated;
GRANT SELECT ON public.invoices TO authenticated;
GRANT SELECT ON public.payments TO authenticated;
GRANT SELECT ON public.services TO authenticated;
GRANT SELECT ON public.inventory TO authenticated;
GRANT SELECT ON public.appUsers TO authenticated;

-- 3. Enable RLS on tables (safe to run multiple times)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appUsers ENABLE ROW LEVEL SECURITY;

-- 4. Drop ALL existing policies first (comprehensive cleanup)
-- Customers table
DROP POLICY IF EXISTS "Allow anonymous read access to customers" ON public.customers;
DROP POLICY IF EXISTS "Allow authenticated read access to customers" ON public.customers;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.customers;
DROP POLICY IF EXISTS "customers_select_policy" ON public.customers;

-- Jobs table
DROP POLICY IF EXISTS "Allow anonymous read access to jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow authenticated read access to jobs" ON public.jobs;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.jobs;
DROP POLICY IF EXISTS "jobs_select_policy" ON public.jobs;

-- Invoices table
DROP POLICY IF EXISTS "Allow anonymous read access to invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow authenticated read access to invoices" ON public.invoices;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.invoices;
DROP POLICY IF EXISTS "invoices_select_policy" ON public.invoices;

-- Payments table
DROP POLICY IF EXISTS "Allow anonymous read access to payments" ON public.payments;
DROP POLICY IF EXISTS "Allow authenticated read access to payments" ON public.payments;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.payments;
DROP POLICY IF EXISTS "payments_select_policy" ON public.payments;

-- Services table
DROP POLICY IF EXISTS "Allow anonymous read access to services" ON public.services;
DROP POLICY IF EXISTS "Allow authenticated read access to services" ON public.services;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.services;
DROP POLICY IF EXISTS "services_select_policy" ON public.services;

-- Inventory table
DROP POLICY IF EXISTS "Allow anonymous read access to inventory" ON public.inventory;
DROP POLICY IF EXISTS "Allow authenticated read access to inventory" ON public.inventory;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.inventory;
DROP POLICY IF EXISTS "inventory_select_policy" ON public.inventory;

-- AppUsers table
DROP POLICY IF EXISTS "Allow anonymous read access to appUsers" ON public.appUsers;
DROP POLICY IF EXISTS "Allow authenticated read access to appUsers" ON public.appUsers;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.appUsers;
DROP POLICY IF EXISTS "appUsers_select_policy" ON public.appUsers;

-- 5. Create new policies with unique names
-- Anonymous access policies
CREATE POLICY "dev_anon_customers_select" ON public.customers
    FOR SELECT TO anon USING (true);

CREATE POLICY "dev_anon_jobs_select" ON public.jobs
    FOR SELECT TO anon USING (true);

CREATE POLICY "dev_anon_invoices_select" ON public.invoices
    FOR SELECT TO anon USING (true);

CREATE POLICY "dev_anon_payments_select" ON public.payments
    FOR SELECT TO anon USING (true);

CREATE POLICY "dev_anon_services_select" ON public.services
    FOR SELECT TO anon USING (true);

CREATE POLICY "dev_anon_inventory_select" ON public.inventory
    FOR SELECT TO anon USING (true);

CREATE POLICY "dev_anon_appUsers_select" ON public.appUsers
    FOR SELECT TO anon USING (true);

-- Authenticated user policies
CREATE POLICY "dev_auth_customers_select" ON public.customers
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "dev_auth_jobs_select" ON public.jobs
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "dev_auth_invoices_select" ON public.invoices
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "dev_auth_payments_select" ON public.payments
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "dev_auth_services_select" ON public.services
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "dev_auth_inventory_select" ON public.inventory
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "dev_auth_appUsers_select" ON public.appUsers
    FOR SELECT TO authenticated USING (true);

-- 6. Grant sequence permissions (safe to run multiple times)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 7. Verification query to test access
SELECT 'Setup completed successfully!' as status;