-- RLS Policy Fix for appUsers table (case-sensitive)
-- The table exists as "appUsers" (camelCase) but PostgreSQL queries look for "appusers" (lowercase)

-- Enable RLS on the correct table name (quoted for case sensitivity)
ALTER TABLE public."appUsers" ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON public."appUsers";
DROP POLICY IF EXISTS "Users can update own profile" ON public."appUsers";
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public."appUsers";
DROP POLICY IF EXISTS "Allow authenticated read access" ON public."appUsers";

-- Create comprehensive policies for the appUsers table
CREATE POLICY "Allow authenticated read access" ON public."appUsers"
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can read own profile" ON public."appUsers"
    FOR SELECT USING (
        auth.uid() = id::uuid OR 
        auth.email() = email
    );

CREATE POLICY "Users can update own profile" ON public."appUsers"
    FOR UPDATE USING (
        auth.uid() = id::uuid OR 
        auth.email() = email
    );

CREATE POLICY "Allow insert for new users" ON public."appUsers"
    FOR INSERT WITH CHECK (
        auth.uid() = id::uuid OR
        auth.role() = 'authenticated'
    );

-- Create a view or alias to handle the case sensitivity issue
-- This creates a lowercase view that points to the camelCase table
CREATE OR REPLACE VIEW public.appusers AS SELECT * FROM public."appUsers";

-- Enable RLS on the view as well
ALTER VIEW public.appusers SET (security_invoker = true);

-- Alternative approach: Create policies on both possible table references
-- In case the auth system uses the view
DO $$
BEGIN
    -- Try to create policies on the lowercase view if it was successfully created
    IF EXISTS (SELECT FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'appusers') THEN
        CREATE POLICY "Allow authenticated read access view" ON public.appusers
            FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Ignore errors if view policies can't be created
    NULL;
END
$$;

-- Show what we've created
SELECT 'RLS policies created for appUsers table' as status;