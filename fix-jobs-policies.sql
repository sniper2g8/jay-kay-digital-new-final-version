-- Fix RLS policies for jobs table to allow authenticated users to insert jobs

-- First, let's check current policies
\echo 'Current policies on jobs table:'
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'jobs';

-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "jobs_select_policy" ON public.jobs;
DROP POLICY IF EXISTS "jobs_insert_policy" ON public.jobs;
DROP POLICY IF EXISTS "jobs_update_policy" ON public.jobs;
DROP POLICY IF EXISTS "Allow authenticated read access to jobs" ON public.jobs;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.jobs;

-- Create comprehensive policies for jobs table
-- Allow authenticated users to read all jobs
CREATE POLICY "authenticated_users_select_jobs" ON public.jobs 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert jobs
CREATE POLICY "authenticated_users_insert_jobs" ON public.jobs 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update jobs they created or if they are admin
CREATE POLICY "authenticated_users_update_jobs" ON public.jobs 
FOR UPDATE 
USING (
  auth.role() = 'authenticated' AND 
  (createdBy = auth.uid() OR 
   EXISTS (
     SELECT 1 FROM public.appUsers 
     WHERE id = auth.uid() 
     AND primary_role IN ('super_admin', 'admin', 'manager')
   ))
);

-- Allow public read access for tracking (anonymous users can view jobs for tracking)
CREATE POLICY "public_read_jobs_for_tracking" ON public.jobs 
FOR SELECT 
USING (true);

-- Ensure RLS is enabled
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

\echo 'New policies created for jobs table:'
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'jobs';