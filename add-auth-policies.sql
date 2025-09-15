-- Comprehensive RLS policies to allow authenticated users to insert/update data

-- Jobs table policies
CREATE POLICY "auth_users_insert_jobs" ON public.jobs
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_users_update_jobs" ON public.jobs
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "auth_users_select_jobs" ON public.jobs
    FOR SELECT TO authenticated USING (true);

-- Customers table policies  
CREATE POLICY "auth_users_insert_customers" ON public.customers
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_users_update_customers" ON public.customers
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "auth_users_select_customers" ON public.customers
    FOR SELECT TO authenticated USING (true);

-- File attachments table policies
CREATE POLICY "auth_users_insert_file_attachments" ON public.file_attachments
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_users_update_file_attachments" ON public.file_attachments
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "auth_users_select_file_attachments" ON public.file_attachments
    FOR SELECT TO authenticated USING (true);

-- Services table policies (in case they're needed)
CREATE POLICY "auth_users_select_services" ON public.services
    FOR SELECT TO authenticated USING (true);

-- AppUsers table policies (for role checks)
CREATE POLICY "auth_users_select_appUsers" ON public.appUsers
    FOR SELECT TO authenticated USING (true);

-- Invoice and payment policies (for future use)
CREATE POLICY "auth_users_insert_invoices" ON public.invoices
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_users_update_invoices" ON public.invoices
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "auth_users_select_invoices" ON public.invoices
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_users_insert_payments" ON public.payments
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_users_update_payments" ON public.payments
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "auth_users_select_payments" ON public.payments
    FOR SELECT TO authenticated USING (true);

-- Ensure RLS is enabled on all tables
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appUsers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;