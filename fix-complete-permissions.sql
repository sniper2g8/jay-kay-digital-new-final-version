-- Complete fix for job submission and file upload permissions
-- This addresses the StorageApiError and job creation RLS violations

-- ==============================================
-- 1. FIX JOBS TABLE PERMISSIONS
-- ==============================================

-- Drop all existing conflicting policies
DROP POLICY IF EXISTS "jobs_select_policy" ON public.jobs;
DROP POLICY IF EXISTS "jobs_insert_policy" ON public.jobs;
DROP POLICY IF EXISTS "jobs_update_policy" ON public.jobs;
DROP POLICY IF EXISTS "Allow authenticated read access to jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow anonymous read access to jobs" ON public.jobs;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.jobs;
DROP POLICY IF EXISTS "authenticated_users_select_jobs" ON public.jobs;
DROP POLICY IF EXISTS "authenticated_users_insert_jobs" ON public.jobs;
DROP POLICY IF EXISTS "authenticated_users_update_jobs" ON public.jobs;
DROP POLICY IF EXISTS "public_read_jobs_for_tracking" ON public.jobs;

-- Enable RLS on jobs table
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create comprehensive job policies
-- Allow authenticated users to insert jobs
CREATE POLICY "jobs_insert_for_authenticated" ON public.jobs 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow authenticated users to read jobs
CREATE POLICY "jobs_select_for_authenticated" ON public.jobs 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to update their own jobs or if admin
CREATE POLICY "jobs_update_for_owners_and_admins" ON public.jobs 
FOR UPDATE 
TO authenticated 
USING (
  createdBy = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.appUsers 
    WHERE id = auth.uid() 
    AND primary_role IN ('super_admin', 'admin', 'manager')
  )
);

-- Allow public read access for job tracking (anyone can view with job ID)
CREATE POLICY "jobs_public_read_for_tracking" ON public.jobs 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- ==============================================
-- 2. FIX FILE_UPLOADS TABLE PERMISSIONS
-- ==============================================

-- Drop existing file upload policies
DROP POLICY IF EXISTS "file_uploads_select_policy" ON public.file_uploads;
DROP POLICY IF EXISTS "file_uploads_insert_policy" ON public.file_uploads;
DROP POLICY IF EXISTS "file_uploads_update_policy" ON public.file_uploads;

-- Enable RLS on file_uploads table
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage file uploads
CREATE POLICY "file_uploads_full_access_for_authenticated" ON public.file_uploads 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- ==============================================
-- 3. FIX FILE_ATTACHMENTS TABLE PERMISSIONS
-- ==============================================

-- Check if file_attachments table exists and fix its policies
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'file_attachments') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "file_attachments_select_policy" ON public.file_attachments;
    DROP POLICY IF EXISTS "file_attachments_insert_policy" ON public.file_attachments;
    DROP POLICY IF EXISTS "file_attachments_update_policy" ON public.file_attachments;
    
    -- Enable RLS
    ALTER TABLE public.file_attachments ENABLE ROW LEVEL SECURITY;
    
    -- Allow authenticated users full access
    CREATE POLICY "file_attachments_full_access_for_authenticated" ON public.file_attachments 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);
  END IF;
END $$;

-- ==============================================
-- 4. FIX STORAGE BUCKET PERMISSIONS
-- ==============================================

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('job-files', 'job-files', false) 
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies
DROP POLICY IF EXISTS "job_files_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "job_files_read_policy" ON storage.objects;
DROP POLICY IF EXISTS "job_files_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to job-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads from job-files" ON storage.objects;

-- Create storage policies for job-files bucket
-- Allow authenticated users to upload files
CREATE POLICY "job_files_upload_for_authenticated" ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'job-files');

-- Allow authenticated users to read files
CREATE POLICY "job_files_read_for_authenticated" ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'job-files');

-- Allow authenticated users to update file metadata
CREATE POLICY "job_files_update_for_authenticated" ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'job-files');

-- Allow authenticated users to delete files
CREATE POLICY "job_files_delete_for_authenticated" ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'job-files');

-- ==============================================
-- 5. GRANT NECESSARY PERMISSIONS
-- ==============================================

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE ON public.jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.file_uploads TO authenticated;

-- Grant file attachments permissions if table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'file_attachments') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.file_attachments TO authenticated;
  END IF;
END $$;

-- Grant storage permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.buckets TO authenticated;

-- ==============================================
-- 6. VERIFICATION QUERIES
-- ==============================================

-- Show current policies for verification
\echo '=== JOBS TABLE POLICIES ==='
SELECT schemaname, tablename, policyname, cmd, roles, qual 
FROM pg_policies 
WHERE tablename = 'jobs' 
ORDER BY policyname;

\echo '=== FILE_UPLOADS TABLE POLICIES ==='
SELECT schemaname, tablename, policyname, cmd, roles, qual 
FROM pg_policies 
WHERE tablename = 'file_uploads' 
ORDER BY policyname;

\echo '=== STORAGE POLICIES ==='
SELECT schemaname, tablename, policyname, cmd, roles, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

\echo '=== STORAGE BUCKETS ==='
SELECT id, name, public FROM storage.buckets WHERE id = 'job-files';

\echo 'Permissions fix completed successfully!'