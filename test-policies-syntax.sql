-- This script tests the corrected policies without actually creating them
-- Run this in your Supabase SQL Editor to verify the syntax

-- First, check if RLS is enabled on jobs table
SELECT relname, relrowsecurity, relforcerowsecurity 
FROM pg_class 
WHERE relname = 'jobs' AND relkind = 'r';

-- Check existing policies on jobs table
SELECT policyname, permissive, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'jobs';

-- Test the EXISTS clause that was failing
SELECT EXISTS (
  SELECT 1 FROM "appUsers" 
  WHERE id = '00000000-0000-0000-0000-000000000000' AND 
  primary_role IN ('admin', 'super_admin')
) as test_result;

-- Show some sample data from appUsers to verify structure
SELECT id, primary_role FROM "appUsers" LIMIT 5;

-- Show roles to verify they exist
SELECT id, name FROM roles;