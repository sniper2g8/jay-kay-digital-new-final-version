-- SQL script to fix RLS policies for all tables
-- This enables proper access for authenticated users and admins

-- Enable RLS on all tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appUsers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finish_options ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to read data
CREATE POLICY "auth_users_select_customers" ON public.customers
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_users_select_jobs" ON public.jobs
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_users_select_invoices" ON public.invoices
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_users_select_payments" ON public.payments
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_users_select_appUsers" ON public."appUsers"
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_users_select_roles" ON public.roles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_users_select_permissions" ON public.permissions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_users_select_user_roles" ON public.user_roles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_users_select_services" ON public.services
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_users_select_inventory" ON public.inventory
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_users_select_paper_sizes" ON public.paper_sizes
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_users_select_paper_weights" ON public.paper_weights
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_users_select_paper_types" ON public.paper_types
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_users_select_finish_options" ON public.finish_options
    FOR SELECT TO authenticated USING (true);

-- Admin policies for full access
CREATE POLICY "admin_full_access_customers" ON public.customers
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public."appUsers"
            WHERE id = auth.uid() AND primary_role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "admin_full_access_jobs" ON public.jobs
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public."appUsers"
            WHERE id = auth.uid() AND primary_role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "admin_full_access_invoices" ON public.invoices
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public."appUsers"
            WHERE id = auth.uid() AND primary_role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "admin_full_access_payments" ON public.payments
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public."appUsers"
            WHERE id = auth.uid() AND primary_role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "admin_full_access_appUsers" ON public."appUsers"
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public."appUsers"
            WHERE id = auth.uid() AND primary_role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "admin_full_access_services" ON public.services
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public."appUsers"
            WHERE id = auth.uid() AND primary_role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "admin_full_access_inventory" ON public.inventory
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public."appUsers"
            WHERE id = auth.uid() AND primary_role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "admin_full_access_paper_specs" ON public.paper_sizes
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public."appUsers"
            WHERE id = auth.uid() AND primary_role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "admin_full_access_paper_weights" ON public.paper_weights
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public."appUsers"
            WHERE id = auth.uid() AND primary_role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "admin_full_access_paper_types" ON public.paper_types
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public."appUsers"
            WHERE id = auth.uid() AND primary_role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "admin_full_access_finish_options" ON public.finish_options
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public."appUsers"
            WHERE id = auth.uid() AND primary_role IN ('admin', 'super_admin')
        )
    );