-- Analysis of your 3 tables: profiles, appUsers, and customers
-- Let's examine the structure and purpose of each table

-- 1. PROFILES TABLE (Created for Supabase auth compatibility)
SELECT 'PROFILES TABLE STRUCTURE:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Sample profiles data
SELECT 'PROFILES SAMPLE DATA:' as info;
SELECT id, email, full_name, avatar_url, created_at FROM public.profiles LIMIT 3;

-- 2. APPUSERS TABLE (Your main application users)
SELECT 'APPUSERS TABLE STRUCTURE:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'appUsers'
ORDER BY ordinal_position;

-- Sample appUsers data
SELECT 'APPUSERS SAMPLE DATA:' as info;
SELECT id, human_id, name, email, primary_role, status, created_at FROM public."appUsers" LIMIT 3;

-- 3. CUSTOMERS TABLE (Your business customers)
SELECT 'CUSTOMERS TABLE STRUCTURE:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'customers'
ORDER BY ordinal_position;

-- Sample customers data
SELECT 'CUSTOMERS SAMPLE DATA:' as info;
SELECT id, human_id, business_name, contact_person, email, status, created_at FROM public.customers LIMIT 3;

-- RELATIONSHIPS AND OVERLAPS
SELECT 'TABLE RELATIONSHIPS ANALYSIS:' as info;

-- Check if there are any overlapping emails
SELECT 'EMAIL OVERLAPS:' as check_type;
SELECT 
  'profiles' as table1,
  'appUsers' as table2,
  COUNT(*) as overlapping_emails
FROM public.profiles p
JOIN public."appUsers" a ON p.email = a.email;

SELECT 
  'appUsers' as table1,
  'customers' as table2,
  COUNT(*) as overlapping_emails
FROM public."appUsers" a
JOIN public.customers c ON a.email = c.email;

-- Count records in each table
SELECT 'RECORD COUNTS:' as info;
SELECT 'profiles' as table_name, COUNT(*) as record_count FROM public.profiles
UNION ALL
SELECT 'appUsers', COUNT(*) FROM public."appUsers"
UNION ALL
SELECT 'customers', COUNT(*) FROM public.customers;