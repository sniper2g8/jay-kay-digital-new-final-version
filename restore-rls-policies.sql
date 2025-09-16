-- RESTORE ROW LEVEL SECURITY (RLS) AND POLICIES
-- Recreate all security policies that were dropped during debugging

-- ====================================================================
-- STEP 1: Enable RLS on all tables
-- ====================================================================

-- Enable RLS on main tables
ALTER TABLE public."appUsers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on other tables if they exist
DO $$ 
BEGIN
    -- Check and enable RLS on jobs table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs' AND table_schema = 'public') THEN
        EXECUTE 'ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY';
    END IF;
    
    -- Check and enable RLS on finances table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'finances' AND table_schema = 'public') THEN
        EXECUTE 'ALTER TABLE public.finances ENABLE ROW LEVEL SECURITY';
    END IF;
    
    -- Check and enable RLS on orders table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders' AND table_schema = 'public') THEN
        EXECUTE 'ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY';
    END IF;
END $$;

-- ====================================================================
-- STEP 2: PROFILES TABLE POLICIES (View of appUsers)
-- ====================================================================

-- Drop existing profiles policies if any
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Since profiles is a VIEW, we need to set policies on the underlying appUsers table
-- but allow access through the profiles view

-- Allow authenticated users to read profiles
CREATE POLICY "Authenticated users can view profiles" ON public.profiles
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- ====================================================================
-- STEP 3: APPUSERS TABLE POLICIES
-- ====================================================================

-- Drop existing appUsers policies
DROP POLICY IF EXISTS "Users can view their own data" ON public."appUsers";
DROP POLICY IF EXISTS "Users can update their own data" ON public."appUsers";
DROP POLICY IF EXISTS "Admins can view all users" ON public."appUsers";
DROP POLICY IF EXISTS "Admins can manage all users" ON public."appUsers";
DROP POLICY IF EXISTS "Super admins can do everything" ON public."appUsers";

-- Policy 1: Users can view their own data
CREATE POLICY "Users can view their own data" ON public."appUsers"
    FOR SELECT
    USING (auth.uid() = id);

-- Policy 2: Users can update their own data  
CREATE POLICY "Users can update their own data" ON public."appUsers"
    FOR UPDATE
    USING (auth.uid() = id);

-- Policy 3: Admins and super_admins can view all users
CREATE POLICY "Admins can view all users" ON public."appUsers"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public."appUsers" 
            WHERE id = auth.uid() 
            AND primary_role IN ('admin', 'super_admin')
        )
    );

-- Policy 4: Super admins can manage all users
CREATE POLICY "Super admins can manage all users" ON public."appUsers"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public."appUsers" 
            WHERE id = auth.uid() 
            AND primary_role = 'super_admin'
        )
    );

-- ====================================================================
-- STEP 4: CUSTOMERS TABLE POLICIES  
-- ====================================================================

-- Drop existing customers policies
DROP POLICY IF EXISTS "Users can view their own customer data" ON public.customers;
DROP POLICY IF EXISTS "Admins can view all customers" ON public.customers;
DROP POLICY IF EXISTS "Admins can manage customers" ON public.customers;
DROP POLICY IF EXISTS "Customer contacts can view their business" ON public.customers;

-- Policy 1: Customer contact persons can view their own business data
CREATE POLICY "Customer contacts can view their business" ON public.customers
    FOR SELECT
    USING (
        contact_person_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public."appUsers" 
            WHERE id = auth.uid() 
            AND primary_role = 'customer'
            AND email = customers.email
        )
    );

-- Policy 2: Admins and super_admins can view all customers
CREATE POLICY "Admins can view all customers" ON public.customers
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public."appUsers" 
            WHERE id = auth.uid() 
            AND primary_role IN ('admin', 'super_admin')
        )
    );

-- Policy 3: Admins and super_admins can manage customers
CREATE POLICY "Admins can manage customers" ON public.customers
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public."appUsers" 
            WHERE id = auth.uid() 
            AND primary_role IN ('admin', 'super_admin')
        )
    );

-- ====================================================================
-- STEP 5: JOBS TABLE POLICIES (if exists)
-- ====================================================================

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs' AND table_schema = 'public') THEN
        -- Drop existing jobs policies
        EXECUTE 'DROP POLICY IF EXISTS "Users can view jobs for their customers" ON public.jobs';
        EXECUTE 'DROP POLICY IF EXISTS "Admins can view all jobs" ON public.jobs';
        EXECUTE 'DROP POLICY IF EXISTS "Admins can manage jobs" ON public.jobs';
        
        -- Policy 1: Customer contacts can view jobs for their businesses
        EXECUTE 'CREATE POLICY "Users can view jobs for their customers" ON public.jobs
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.customers c
                    WHERE c.id = jobs.customer_id
                    AND c.contact_person_id = auth.uid()
                )
                OR EXISTS (
                    SELECT 1 FROM public."appUsers" 
                    WHERE id = auth.uid() 
                    AND primary_role IN (''admin'', ''super_admin'')
                )
            )';
        
        -- Policy 2: Admins can manage all jobs
        EXECUTE 'CREATE POLICY "Admins can manage jobs" ON public.jobs
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public."appUsers" 
                    WHERE id = auth.uid() 
                    AND primary_role IN (''admin'', ''super_admin'')
                )
            )';
    END IF;
END $$;

-- ====================================================================
-- STEP 6: FINANCES TABLE POLICIES (if exists)
-- ====================================================================

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'finances' AND table_schema = 'public') THEN
        -- Drop existing finance policies
        EXECUTE 'DROP POLICY IF EXISTS "Admins can view all finances" ON public.finances';
        EXECUTE 'DROP POLICY IF EXISTS "Admins can manage finances" ON public.finances';
        
        -- Policy 1: Only admins and super_admins can view finances
        EXECUTE 'CREATE POLICY "Admins can view all finances" ON public.finances
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public."appUsers" 
                    WHERE id = auth.uid() 
                    AND primary_role IN (''admin'', ''super_admin'')
                )
            )';
        
        -- Policy 2: Only admins and super_admins can manage finances
        EXECUTE 'CREATE POLICY "Admins can manage finances" ON public.finances
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public."appUsers" 
                    WHERE id = auth.uid() 
                    AND primary_role IN (''admin'', ''super_admin'')
                )
            )';
    END IF;
END $$;

-- ====================================================================
-- STEP 7: VERIFICATION
-- ====================================================================

-- Check RLS status on all tables
SELECT 'RLS STATUS CHECK' as verification;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    hasrls as has_rls_policies
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('appUsers', 'customers', 'profiles', 'jobs', 'finances')
ORDER BY tablename;

-- Check policies created
SELECT 'POLICIES CREATED' as verification;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

SELECT '🔒 Row Level Security and Policies Restored!' as result;