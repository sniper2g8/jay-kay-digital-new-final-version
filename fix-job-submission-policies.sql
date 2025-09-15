-- Comprehensive SQL script to fix job submission and file upload permissions
-- Run this in your Supabase SQL Editor

-- 1. Grant basic schema and table permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 2. Grant INSERT permissions for job submission
GRANT INSERT, SELECT ON public.jobs TO anon;
GRANT INSERT, SELECT ON public.customers TO anon;
GRANT INSERT, SELECT ON public.file_attachments TO anon;

-- Grant the same to authenticated users
GRANT INSERT, SELECT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE ON public.file_attachments TO authenticated;

-- 3. Grant sequence permissions (needed for auto-incrementing IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4. Enable RLS on tables (if not already enabled)
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Enable RLS on file_attachments if the table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'file_attachments') THEN
        ALTER TABLE public.file_attachments ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 5. Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Allow anonymous read access to jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow anonymous read access to customers" ON public.customers;
DROP POLICY IF EXISTS "Allow anonymous insert jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow anonymous insert customers" ON public.customers;
DROP POLICY IF EXISTS "Allow anonymous insert file_attachments" ON public.file_attachments;
DROP POLICY IF EXISTS "Allow anonymous full access to jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow anonymous full access to customers" ON public.customers;
DROP POLICY IF EXISTS "Allow anonymous full access to file_attachments" ON public.file_attachments;

-- 6. Create comprehensive RLS policies for jobs table
CREATE POLICY "Allow anonymous full access to jobs" ON public.jobs
    FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated full access to jobs" ON public.jobs
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. Create comprehensive RLS policies for customers table
CREATE POLICY "Allow anonymous full access to customers" ON public.customers
    FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated full access to customers" ON public.customers
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8. Create comprehensive RLS policies for file_attachments table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'file_attachments') THEN
        EXECUTE 'CREATE POLICY "Allow anonymous full access to file_attachments" ON public.file_attachments FOR ALL TO anon USING (true) WITH CHECK (true)';
        EXECUTE 'CREATE POLICY "Allow authenticated full access to file_attachments" ON public.file_attachments FOR ALL TO authenticated USING (true) WITH CHECK (true)';
    END IF;
END $$;

-- 9. Ensure other required tables have basic permissions
GRANT SELECT ON public.services TO anon, authenticated;
GRANT SELECT ON public.inventory TO anon, authenticated;

-- Grant permissions for paper specification tables
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'paper_sizes') THEN
        GRANT SELECT ON public.paper_sizes TO anon, authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'paper_weights') THEN
        GRANT SELECT ON public.paper_weights TO anon, authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'paper_types') THEN
        GRANT SELECT ON public.paper_types TO anon, authenticated;
    END IF;
END $$;

-- 10. Create policies for paper specification tables (if they have RLS enabled)
DO $$
BEGIN
    -- Check if RLS is enabled and create policies if needed
    IF EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'paper_sizes' AND n.nspname = 'public' AND c.relrowsecurity
    ) THEN
        DROP POLICY IF EXISTS "Allow read access to paper_sizes" ON public.paper_sizes;
        CREATE POLICY "Allow read access to paper_sizes" ON public.paper_sizes
            FOR SELECT TO anon, authenticated USING (true);
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'paper_weights' AND n.nspname = 'public' AND c.relrowsecurity
    ) THEN
        DROP POLICY IF EXISTS "Allow read access to paper_weights" ON public.paper_weights;
        CREATE POLICY "Allow read access to paper_weights" ON public.paper_weights
            FOR SELECT TO anon, authenticated USING (true);
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'paper_types' AND n.nspname = 'public' AND c.relrowsecurity
    ) THEN
        DROP POLICY IF EXISTS "Allow read access to paper_types" ON public.paper_types;
        CREATE POLICY "Allow read access to paper_types" ON public.paper_types
            FOR SELECT TO anon, authenticated USING (true);
    END IF;
END $$;

-- 11. Show completion message
SELECT 'Database policies updated successfully! Now create storage policies manually.' as status;