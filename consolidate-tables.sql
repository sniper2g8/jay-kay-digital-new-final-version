-- Data Consolidation Plan for appUsers, profiles, and customers
-- This resolves the table structure and data conflicts
-- NOTE: First run fix-table-case.sql to ensure only "appUsers" (camelCase) exists

-- ====================================================================
-- CONSOLIDATION PLAN
-- ====================================================================

/*
CURRENT STATE (after case fix):
- "appUsers": All user accounts (consolidated from appusers + appUsers)
- customers: Business entities 
- profiles: Empty/blocked table
- Email conflicts resolved during case consolidation

PLAN:
1. Ensure only "appUsers" (camelCase) table exists
2. Keep customers as business entities
3. Make profiles a VIEW of "appUsers"
4. Add proper relationships via contact_person_id
5. Maintain data consistency
*/

-- ====================================================================
-- STEP 1: Verify table case consistency
-- ====================================================================

-- Ensure we're working with the correct table
SELECT 'TABLE CONSISTENCY CHECK' as step;

-- Verify only "appUsers" (camelCase) exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appusers')
    THEN '⚠️  appusers (lowercase) still exists - run fix-table-case.sql first'
    ELSE '✅ No lowercase appusers table'
  END as lowercase_check,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appUsers')
    THEN '✅ appUsers (camelCase) exists'
    ELSE '❌ appUsers (camelCase) missing'
  END as camelcase_check;

-- ====================================================================
-- STEP 2: Analyze current data (using correct table name)
-- ====================================================================

-- Check current conflict detail (updated for correct table reference)
SELECT 'CONFLICT ANALYSIS:' as step;
SELECT 
  'appUsers' as source,
  id::text,
  name,
  email,
  primary_role,
  human_id
FROM public."appUsers" 
WHERE email = 'hello@ishmaelbull.xyz'

UNION ALL

SELECT 
  'customers' as source,
  id::text,
  business_name as name,
  email,
  'business' as primary_role,
  human_id
FROM public.customers 
WHERE email = 'hello@ishmaelbull.xyz';

-- ====================================================================
-- STEP 3: Add contact_person_id to customers table
-- ====================================================================

-- Add foreign key column to link customers to appUsers
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS contact_person_id uuid 
REFERENCES public."appUsers"(id);

-- ====================================================================
-- STEP 4: Link existing customers to appUsers where possible
-- ====================================================================

-- Update the Inkee Media customer to link to the appUser
UPDATE public.customers 
SET 
  contact_person_id = (
    SELECT id 
    FROM public."appUsers" 
    WHERE email = 'hello@ishmaelbull.xyz'
  ),
  email = NULL  -- Remove duplicate email since we're linking via contact_person_id
WHERE email = 'hello@ishmaelbull.xyz';

-- ====================================================================
-- STEP 5: Create profiles as a VIEW of appUsers
-- ====================================================================

-- Drop the existing profiles (check if it's a table or view and drop accordingly)
DO $$ 
BEGIN
  -- Check if profiles is a view
  IF EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    DROP VIEW IF EXISTS public.profiles CASCADE;
    RAISE NOTICE 'Dropped profiles VIEW';
  -- Check if profiles is a table
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND table_type = 'BASE TABLE'
  ) THEN
    DROP TABLE IF EXISTS public.profiles CASCADE;
    RAISE NOTICE 'Dropped profiles TABLE';
  ELSE
    RAISE NOTICE 'profiles does not exist or already dropped';
  END IF;
END $$;

-- Create profiles as a view of appUsers for Supabase auth compatibility
CREATE VIEW public.profiles AS 
SELECT 
  id::uuid as id,
  email,
  name as full_name,
  NULL as avatar_url,
  created_at,
  updated_at
FROM public."appUsers";

-- ====================================================================
-- STEP 6: Set proper permissions on the view
-- ====================================================================

-- Grant permissions on the profiles view
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- ====================================================================
-- STEP 7: Verification queries
-- ====================================================================

-- Verify the consolidation worked
SELECT 'VERIFICATION - customers with contact persons:' as verification;
SELECT 
  c.business_name,
  c.human_id as customer_id,
  u.name as contact_person,
  u.email as contact_email,
  u.primary_role
FROM public.customers c
LEFT JOIN public."appUsers" u ON c.contact_person_id = u.id;

SELECT 'VERIFICATION - profiles view:' as verification;
SELECT 
  id,
  email,
  full_name
FROM public.profiles
LIMIT 3;

SELECT 'VERIFICATION - no more email conflicts:' as verification;
SELECT 
  (SELECT COUNT(*) FROM public."appUsers" WHERE email = 'hello@ishmaelbull.xyz') as appUsers_count,
  (SELECT COUNT(*) FROM public.customers WHERE email = 'hello@ishmaelbull.xyz') as customers_count,
  (SELECT COUNT(*) FROM public.profiles WHERE email = 'hello@ishmaelbull.xyz') as profiles_count;

-- ====================================================================
-- FINAL STRUCTURE SUMMARY
-- ====================================================================

SELECT 'FINAL STRUCTURE:' as summary;
SELECT 
  'appUsers: User accounts (staff, admins, customer users) - camelCase table' as table_purpose
UNION ALL
SELECT 
  'customers: Business entities linked to appUsers via contact_person_id'
UNION ALL
SELECT 
  'profiles: VIEW of appUsers for Supabase auth compatibility';

SELECT 'Table consolidation complete! 🎉' as status;