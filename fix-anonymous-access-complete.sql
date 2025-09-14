-- Comprehensive SQL script to fix anonymous access permissions
-- This addresses both schema-level and table-level permissions

-- 1. FIRST: Grant basic schema access to anon role
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 2. Grant table-level permissions to anon role for key tables
GRANT SELECT ON public.customers TO anon;
GRANT SELECT ON public.jobs TO anon;
GRANT SELECT ON public.invoices TO anon;
GRANT SELECT ON public.payments TO anon;
GRANT SELECT ON public.services TO anon;
GRANT SELECT ON public.inventory TO anon;

-- 3. Enable RLS on tables (if not already enabled)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow anonymous read access to customers" ON public.customers;
DROP POLICY IF EXISTS "Allow anonymous read access to jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow anonymous read access to invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow anonymous read access to payments" ON public.payments;
DROP POLICY IF EXISTS "Allow anonymous read access to services" ON public.services;
DROP POLICY IF EXISTS "Allow anonymous read access to inventory" ON public.inventory;

-- 5. Create RLS policies to allow anonymous read access
CREATE POLICY "Allow anonymous read access to customers" ON public.customers
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous read access to jobs" ON public.jobs
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous read access to invoices" ON public.invoices
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous read access to payments" ON public.payments
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous read access to services" ON public.services
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous read access to inventory" ON public.inventory
    FOR SELECT TO anon USING (true);

-- 6. Also allow authenticated users (for when you implement proper auth)
CREATE POLICY "Allow authenticated read access to customers" ON public.customers
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access to jobs" ON public.jobs
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access to invoices" ON public.invoices
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access to payments" ON public.payments
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access to services" ON public.services
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access to inventory" ON public.inventory
    FOR SELECT TO authenticated USING (true);

-- 7. Grant sequence permissions (needed for auto-incrementing IDs)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 8. Verification query - uncomment to test
-- SELECT 'customers' as table_name, count(*) as record_count FROM public.customers
-- UNION ALL
-- SELECT 'jobs', count(*) FROM public.jobs
-- UNION ALL  
-- SELECT 'invoices', count(*) FROM public.invoices
-- UNION ALL
-- SELECT 'payments', count(*) FROM public.payments;
