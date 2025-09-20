# Fixing Job Update Errors

## Problem
You're seeing two related errors:
1. "Status update error: {}" when updating job status in the job detail page
2. "Update error: {}" when editing job details

Both errors are caused by **Row Level Security (RLS) policies** not being properly configured on the jobs table in Supabase.

## Root Cause
The errors occur because:
1. RLS is enabled on the jobs table
2. No policies exist that allow authenticated users to update jobs
3. When the application tries to update job data, Supabase returns a permission denied error (code 42501)

## Solution
You need to add RLS policies to the jobs table that allow appropriate users to perform CRUD operations.

## Implementation Steps

### Step 1: Access Supabase Dashboard
1. Log in to your Supabase project dashboard
2. Navigate to the SQL Editor

### Step 2: Apply RLS Policies
Choose one of the following options:

#### Option A: Basic Policies (Simple)
Run the SQL commands in `fix-jobs-rls-policies.sql`:

```sql
-- Enable RLS on jobs table (if not already enabled)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Create policy for SELECT - all authenticated users can read jobs
CREATE POLICY "Users can read jobs" 
ON jobs 
FOR SELECT 
USING (true);

-- Create policy for INSERT - authenticated users can create jobs
CREATE POLICY "Staff can create jobs" 
ON jobs 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Create policy for UPDATE - authenticated users can update jobs
CREATE POLICY "Staff can update jobs" 
ON jobs 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Create policy for DELETE - only admins can delete jobs
CREATE POLICY "Admins can delete jobs" 
ON jobs 
FOR DELETE 
USING (
  auth.role() = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM appUsers 
    WHERE id = auth.uid() AND 
    primary_role IN ('admin', 'super_admin')
  )
);

-- Grant necessary permissions to the authenticated role
GRANT ALL ON TABLE jobs TO authenticated;
```

#### Option B: Restrictive Policies (More Secure)
Run the SQL commands in `fix-jobs-rls-policies-restrictive.sql`:

```sql
-- Enable RLS on jobs table (if not already enabled)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Create policy for SELECT - all authenticated users can read jobs
CREATE POLICY "Users can read jobs" 
ON jobs 
FOR SELECT 
USING (true);

-- Create policy for INSERT - authenticated users can create jobs
CREATE POLICY "Users can create jobs" 
ON jobs 
FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' AND 
  (
    -- Staff can create any job
    EXISTS (
      SELECT 1 FROM appUsers 
      WHERE id = auth.uid() AND 
      primary_role IN ('admin', 'staff', 'manager')
    ) OR
    -- Customers can create jobs for themselves
    (customer_id = auth.uid())
  )
);

-- Create policy for UPDATE - users can update jobs they created or are assigned to
CREATE POLICY "Users can update jobs" 
ON jobs 
FOR UPDATE 
USING (
  auth.role() = 'authenticated' AND 
  (
    -- Staff can update any job
    EXISTS (
      SELECT 1 FROM appUsers 
      WHERE id = auth.uid() AND 
      primary_role IN ('admin', 'staff', 'manager')
    ) OR
    -- Customers can update their own jobs
    (customer_id = auth.uid()) OR
    -- Assigned users can update jobs
    (assigned_to = auth.uid())
  )
);

-- Create policy for DELETE - only admins can delete jobs
CREATE POLICY "Admins can delete jobs" 
ON jobs 
FOR DELETE 
USING (
  auth.role() = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM appUsers 
    WHERE id = auth.uid() AND 
    primary_role IN ('admin', 'super_admin')
  )
);

-- Grant necessary permissions to the authenticated role
GRANT ALL ON TABLE jobs TO authenticated;
```

### Step 3: Verify the Fix
1. Run the verification script: `node verify-jobs-rls-fix.js`
2. Or test directly in the application:
   - Go to a job detail page: `/dashboard/jobs/[jobId]`
   - Try to change the status using the dropdown
   - Go to the job edit page: `/dashboard/jobs/[jobId]/edit`
   - Try to update job details
   - Both operations should now work without errors

## Files in This Directory
- `FIX_JOB_STATUS_UPDATE.md` - Complete guide with step-by-step instructions
- `fix-jobs-rls-policies.sql` - Basic RLS policies for the jobs table
- `fix-jobs-rls-policies-restrictive.sql` - More restrictive RLS policies for better security
- `verify-jobs-rls-fix.js` - Script to verify the fix works
- `check-rls-policies.sql` - Diagnostic SQL to check current RLS policies

## Troubleshooting
If you still see permission errors after applying the policies:

1. Make sure RLS is enabled on the jobs table:
   ```sql
   ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
   ```

2. Check that the policies were created correctly:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'jobs';
   ```

3. Ensure the `appUsers` table has the correct role information for users

## Additional Notes
- The `auth.role() = 'authenticated'` check ensures only logged-in users can perform operations
- The `auth.uid()` function returns the ID of the currently authenticated user
- The policies ensure appropriate access control based on user roles