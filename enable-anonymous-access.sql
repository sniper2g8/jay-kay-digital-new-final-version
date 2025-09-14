-- SQL script to enable anonymous read access for development
-- WARNING: This is for development only. In production, you should implement proper authentication.

-- Enable RLS policies for anonymous read access on key tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies to allow anonymous read access (DEVELOPMENT ONLY)
CREATE POLICY "Allow anonymous read access to customers" ON public.customers
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous read access to jobs" ON public.jobs
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous read access to invoices" ON public.invoices
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous read access to payments" ON public.payments
    FOR SELECT USING (true);

-- You can also add policies for other tables as needed:
CREATE POLICY "Allow anonymous read access to services" ON public.services
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous read access to inventory" ON public.inventory
    FOR SELECT USING (true);

-- Note: These policies allow anyone to read data without authentication
-- In production, replace these with proper user-based policies
