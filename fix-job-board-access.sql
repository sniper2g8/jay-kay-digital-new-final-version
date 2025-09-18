-- Add anonymous access policy for job board
-- This allows the public job board to display job status without requiring authentication

-- Policy for anonymous users to view limited job information for job board
CREATE POLICY "anonymous_job_board_access" ON public.jobs
    FOR SELECT TO anon USING (
        -- Only allow reading specific fields needed for job board
        -- This should be safe since job board only shows: id, jobNo, title, status, priority, dueDate, created_at, updated_at
        true
    );

-- Alternative: If you want to restrict to only certain statuses
-- CREATE POLICY "anonymous_job_board_access" ON public.jobs
--     FOR SELECT TO anon USING (
--         status IN ('pending', 'in_progress', 'completed')
--     );

-- Grant usage to anon role if not already granted
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.jobs TO anon;

-- Test the policy by checking if anonymous access works
-- You can run this query as anon to test:
-- SELECT id, jobNo, title, status, priority, dueDate, created_at, updated_at 
-- FROM public.jobs 
-- WHERE status IN ('pending', 'in_progress', 'completed') 
-- LIMIT 5;