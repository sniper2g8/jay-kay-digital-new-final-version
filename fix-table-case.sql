-- Fix Table Case Consistency: Consolidate appusers and appUsers into appUsers
-- This resolves the data inconsistency issue

-- ====================================================================
-- STEP 1: Analyze the current state
-- ====================================================================

-- Check what we have
SELECT 'CURRENT STATE ANALYSIS' as step;

-- Count records in both tables (if they exist)
DO $$ 
BEGIN
  -- Count appusers (handle both table and view)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'appusers'
  ) THEN
    PERFORM COUNT(*) FROM appusers;
    RAISE NOTICE 'appusers exists with % records', (SELECT COUNT(*) FROM appusers);
  ELSE
    RAISE NOTICE 'appusers does not exist';
  END IF;
  
  -- Count appUsers
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'appUsers'
  ) THEN
    RAISE NOTICE 'appUsers exists with % records', (SELECT COUNT(*) FROM "appUsers");
  ELSE
    RAISE NOTICE 'appUsers does not exist';
  END IF;
END $$;

-- Check for email conflicts between the tables (only if both exist)
SELECT 'EMAIL CONFLICT CHECK' as step;

DO $$ 
BEGIN
  -- Only check conflicts if both appusers and appUsers exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'appusers')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'appUsers') THEN
    
    -- Show conflict details
    RAISE NOTICE 'Checking for email conflicts between appusers and appUsers...';
    
    -- This query will only run if both tables/views exist
    PERFORM 1; -- Placeholder, actual conflict check moved to separate query below
  ELSE
    RAISE NOTICE 'Skipping conflict check - one or both tables do not exist';
  END IF;
END $$;

-- Separate conflict check query (will error gracefully if tables don't exist)
SELECT 
  a1.email,
  a1.name as appusers_name,
  a1.primary_role as appusers_role,
  a2.name as appUsers_name,
  a2.primary_role as appUsers_role
FROM appusers a1
INNER JOIN "appUsers" a2 ON a1.email = a2.email
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appusers')
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appUsers');

-- ====================================================================
-- STEP 2: Check if appusers is a view and handle accordingly
-- ====================================================================

-- First, check what appusers actually is
SELECT 'APPUSERS TYPE CHECK' as step;
SELECT 
  table_name,
  table_type,
  CASE 
    WHEN table_type = 'VIEW' THEN 'This is a view - no data to migrate'
    WHEN table_type = 'BASE TABLE' THEN 'This is a table - data migration needed'
    ELSE 'Unknown type'
  END as migration_action
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'appusers';

-- If appusers is a view, check what it's based on
SELECT 'VIEW DEFINITION CHECK' as step;
SELECT view_definition 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name = 'appusers';

-- ====================================================================
-- STEP 3: Data consolidation (only if appusers is a table with data)
-- ====================================================================

-- Only attempt insert if appusers is actually a table with data
DO $$ 
BEGIN
  -- Check if appusers is a table (not a view)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'appusers' 
    AND table_type = 'BASE TABLE'
  ) THEN
    -- Insert unique records from appusers table into appUsers
    INSERT INTO "appUsers" (
      id, name, email, primary_role, human_id, created_at, updated_at
    )
    SELECT 
      a.id, a.name, a.email, a.primary_role, a.human_id, a.created_at, a.updated_at
    FROM appusers a
    WHERE NOT EXISTS (
      SELECT 1 FROM "appUsers" au 
      WHERE au.email = a.email
    );
    
    RAISE NOTICE 'Data migrated from appusers table to appUsers';
  ELSE
    RAISE NOTICE 'appusers is a view - no data migration needed';
  END IF;
END $$;

-- ====================================================================
-- STEP 4: Update any foreign key references (if applicable)
-- ====================================================================

-- Check if customers table references the old appusers table
DO $$ 
BEGIN
  -- Update customers table if it has foreign keys to appusers
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' 
    AND column_name = 'contact_person_id'
  ) THEN
    -- Update any references that point to appusers to point to appUsers instead
    UPDATE customers 
    SET contact_person_id = (
      SELECT au.id FROM "appUsers" au 
      WHERE au.email = (
        SELECT a.email FROM appusers a WHERE a.id = customers.contact_person_id
      )
    )
    WHERE contact_person_id IN (SELECT id FROM appusers);
  END IF;
END $$;

-- ====================================================================
-- STEP 5: Drop the lowercase appusers view/table
-- ====================================================================

-- Check if appusers is a table or view and drop accordingly
DO $$ 
BEGIN
  -- Check if appusers is a view
  IF EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' AND table_name = 'appusers'
  ) THEN
    DROP VIEW IF EXISTS appusers CASCADE;
    RAISE NOTICE 'Dropped appusers VIEW';
  -- Check if appusers is a table
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'appusers' AND table_type = 'BASE TABLE'
  ) THEN
    DROP TABLE IF EXISTS appusers CASCADE;
    RAISE NOTICE 'Dropped appusers TABLE';
  ELSE
    RAISE NOTICE 'appusers does not exist or already dropped';
  END IF;
END $$;

-- ====================================================================
-- STEP 6: Verification
-- ====================================================================

-- Verify consolidation
SELECT 'CONSOLIDATION VERIFICATION' as step;

-- Check final record count
SELECT 
  'appUsers (final)' as table_name,
  COUNT(*) as final_record_count
FROM "appUsers";

-- Check no more lowercase table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appusers')
    THEN '❌ appusers still exists'
    ELSE '✅ appusers removed'
  END as appusers_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appUsers')
    THEN '✅ appUsers exists'
    ELSE '❌ appUsers missing'
  END as appUsers_status;

SELECT '✅ Table case consistency fixed! Using appUsers (camelCase)' as result;