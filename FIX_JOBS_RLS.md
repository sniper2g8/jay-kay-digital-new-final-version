# Fix Jobs Table RLS Policies

## Problem
The job status update is failing with "Status update error: {}" because Row Level Security (RLS) is enabled on the jobs table, but there are no policies allowing users to update jobs.

## Solution
You need to add RLS policies to the jobs table that allow appropriate users to:
1. Read jobs
2. Insert jobs
3. Update jobs
4. Delete jobs

## Steps to Fix

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Policies**
3. Find the `jobs` table in the list
4. Click on the table name to view existing policies
5. Click **"Add policy"** and add the following policies:

#### SELECT Policy (Read)
- **Name**: Users can read jobs
- **Operation**: SELECT
- **Using**: `(true)` (Allow all authenticated users to read jobs)

#### INSERT Policy (Create)
- **Name**: Staff can create jobs
- **Operation**: INSERT
- **With Check**: `(auth.role() = 'authenticated')`

#### UPDATE Policy (Update)
- **Name**: Staff can update jobs
- **Operation**: UPDATE
- **Using**: `(auth.role() = 'authenticated')`

#### DELETE Policy (Delete)
- **Name**: Admins can delete jobs
- **Operation**: DELETE
- **Using**: `(auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM appUsers WHERE id = auth.uid() AND primary_role IN ('admin', 'super_admin')))`

### Option 2: Using SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the following SQL commands:

```sql
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
USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM appUsers WHERE id = auth.uid() AND primary_role IN ('admin', 'super_admin')));
```

## More Restrictive Policies (Optional)

If you want more fine-grained control, you can use these policies:

```sql
-- SELECT: Users can read all jobs
CREATE POLICY "Users can read jobs" 
ON jobs 
FOR SELECT 
USING (true);

-- INSERT: Users can create jobs, customers can only create their own
CREATE POLICY "Users can create jobs" 
ON jobs 
FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' AND 
  (
    -- Staff can create any job
    EXISTS (SELECT 1 FROM appUsers WHERE id = auth.uid() AND primary_role IN ('admin', 'staff', 'manager')) OR
    -- Customers can create jobs for themselves
    (customer_id = auth.uid())
  )
);

-- UPDATE: Users can update jobs they created or are assigned to
CREATE POLICY "Users can update jobs" 
ON jobs 
FOR UPDATE 
USING (
  auth.role() = 'authenticated' AND 
  (
    -- Staff can update any job
    EXISTS (SELECT 1 FROM appUsers WHERE id = auth.uid() AND primary_role IN ('admin', 'staff', 'manager')) OR
    -- Customers can update their own jobs
    (customer_id = auth.uid()) OR
    -- Assigned users can update jobs
    (assigned_to = auth.uid())
  )
);

-- DELETE: Only admins can delete jobs
CREATE POLICY "Admins can delete jobs" 
ON jobs 
FOR DELETE 
USING (
  auth.role() = 'authenticated' AND 
  EXISTS (SELECT 1 FROM appUsers WHERE id = auth.uid() AND primary_role IN ('admin', 'super_admin'))
);
```

## Verification

After applying the policies, you can verify they work by:

1. Going to a job detail page: `/dashboard/jobs/[jobId]`
2. Try to change the status using the dropdown
3. The error should no longer appear
4. The status should update successfully

## Additional Notes

- The `auth.role() = 'authenticated'` check ensures only logged-in users can perform operations
- The `auth.uid()` function returns the ID of the currently authenticated user
- The policies ensure appropriate access control based on user roles

## Troubleshooting

If you still see permission errors:

1. Make sure RLS is enabled on the jobs table:
   ```sql
   ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
   ```

2. Check that the policies were created correctly:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'jobs';
   ```

3. Ensure the `appUsers` table has the correct role information for users