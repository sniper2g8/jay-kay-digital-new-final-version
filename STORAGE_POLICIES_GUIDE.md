# Fix Job Submission and File Upload Permissions

## Step 1: Database Policies (SQL Editor)

Copy and paste the contents of `fix-job-submission-policies.sql` into your Supabase SQL Editor and run it.

## Step 2: Storage Policies (Storage Dashboard)

After running the SQL script, you need to create storage policies for the `job-files` bucket:

### Go to Storage > Policies in your Supabase dashboard

### Create these 3 policies for the `job-files` bucket:

#### Policy 1: Allow Anonymous Upload
- **Policy Name**: `Allow anonymous upload to job-files`
- **Allowed Operation**: `INSERT` 
- **Target Roles**: `anon`
- **Policy Definition**: `true`

#### Policy 2: Allow Anonymous Read
- **Policy Name**: `Allow anonymous read from job-files`
- **Allowed Operation**: `SELECT`
- **Target Roles**: `anon` 
- **Policy Definition**: `true`

#### Policy 3: Allow Authenticated Full Access
- **Policy Name**: `Allow authenticated full access to job-files`
- **Allowed Operation**: `ALL`
- **Target Roles**: `authenticated`
- **Policy Definition**: `true`

### Alternative: Quick Storage Policy SQL

If you prefer SQL, you can also run this in the SQL Editor (but storage policies are usually easier to create in the dashboard):

```sql
-- Storage policies for job-files bucket
-- Note: These may need to be created in the Storage UI instead

-- Allow anonymous users to upload files
INSERT INTO storage.objects (bucket_id, name, owner, metadata) 
VALUES ('job-files', 'test', null, '{}') 
WHERE auth.role() = 'anon';

-- Allow anonymous users to read files  
SELECT * FROM storage.objects 
WHERE bucket_id = 'job-files' AND auth.role() = 'anon';
```

## Step 3: Verify the Fix

After completing both steps, test job submission to verify:

1. ✅ Customer creation works
2. ✅ Job creation works  
3. ✅ File upload works
4. ✅ No more "permission denied" errors

## Troubleshooting

If you still get permission errors:

1. **Check the browser console** for specific error messages
2. **Verify bucket name** is exactly `job-files` 
3. **Ensure RLS is enabled** on tables but policies allow access
4. **Check your Supabase project** has the correct tables (`jobs`, `customers`, `file_attachments`)

## Tables That Need These Permissions:

- ✅ `jobs` - INSERT, SELECT (for job creation)
- ✅ `customers` - INSERT, SELECT (for customer creation) 
- ✅ `file_attachments` - INSERT, SELECT (for file metadata)
- ✅ `services` - SELECT (for service options)
- ✅ `paper_sizes`, `paper_weights`, `paper_types` - SELECT (for specifications)
- ✅ Storage bucket `job-files` - INSERT, SELECT (for file uploads)