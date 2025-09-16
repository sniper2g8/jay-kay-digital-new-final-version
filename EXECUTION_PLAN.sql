-- EXECUTION PLAN: Fix Table Case Consistency and Consolidate Structure
-- Run these scripts in order to resolve the appusers/appUsers confusion

-- ====================================================================
-- STEP 1: Fix Table Case Consistency (CRITICAL - RUN FIRST)
-- ====================================================================

/*
Problem: Both "appusers" (lowercase) and "appUsers" (camelCase) tables exist
Solution: Consolidate all data into "appUsers" (camelCase) and remove "appusers"

ACTION: Run fix-table-case.sql in Supabase SQL Editor
This will:
- Merge unique data from appusers into appUsers
- Update foreign key references
- Drop the appusers table
- Leave only appUsers (camelCase)
*/

-- ====================================================================
-- STEP 2: Consolidate Table Structure (RUN AFTER STEP 1)
-- ====================================================================

/*
Problem: Confused relationship between appUsers, profiles, and customers
Solution: Create clear table relationships and purposes

ACTION: Run consolidate-tables.sql in Supabase SQL Editor
This will:
- Verify table case consistency
- Add contact_person_id to customers
- Create profiles as VIEW of appUsers
- Resolve email conflicts
- Set proper permissions
*/

-- ====================================================================
-- VERIFICATION STEPS
-- ====================================================================

-- After running both scripts, verify:

-- 1. Only appUsers (camelCase) exists
SELECT 
  table_name,
  CASE 
    WHEN table_name = 'appUsers' THEN '✅ Correct (camelCase)'
    WHEN table_name = 'appusers' THEN '❌ Should not exist'
    ELSE 'Other'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name ILIKE '%appuser%';

-- 2. Profiles is a view, not a table
SELECT 
  table_name,
  table_type,
  CASE 
    WHEN table_name = 'profiles' AND table_type = 'VIEW' THEN '✅ Correct (View)'
    WHEN table_name = 'profiles' AND table_type = 'BASE TABLE' THEN '❌ Should be view'
    ELSE 'N/A'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'profiles';

-- 3. Customers have contact_person_id links
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND column_name = 'contact_person_id';

-- ====================================================================
-- EXECUTION INSTRUCTIONS
-- ====================================================================

/*
1. Copy fix-table-case.sql and run in Supabase SQL Editor
2. Wait for completion and verify no errors
3. Copy consolidate-tables.sql and run in Supabase SQL Editor  
4. Run verification queries above
5. Test authentication functionality
*/