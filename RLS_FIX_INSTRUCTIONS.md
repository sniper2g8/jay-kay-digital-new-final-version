# 🔧 Jobs Table RLS Policy Fix

## ❌ Current Issue
- Console Error: `Job creation error: {}`
- Detailed Error: `Failed to create job: permission denied for table jobs`

## 🔍 Root Cause
The jobs table has RLS (Row Level Security) enabled but only has SELECT policies for anonymous users. There are no INSERT policies for authenticated users.

## ✅ Solution

### Option 1: Execute SQL in Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `pnoxqzlxfuvjvufdjuqh`
3. **Navigate to**: SQL Editor
4. **Copy and paste this SQL**:

```sql
-- Add INSERT policies for authenticated users
CREATE POLICY "auth_users_insert_jobs" ON public.jobs
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_users_update_jobs" ON public.jobs
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "auth_users_select_jobs" ON public.jobs
    FOR SELECT TO authenticated USING (true);

-- Add policies for customers table (needed for new customer creation)
CREATE POLICY "auth_users_insert_customers" ON public.customers
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_users_update_customers" ON public.customers
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "auth_users_select_customers" ON public.customers
    FOR SELECT TO authenticated USING (true);

-- Add policies for file_attachments table if it exists
CREATE POLICY "auth_users_insert_file_attachments" ON public.file_attachments
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_users_select_file_attachments" ON public.file_attachments
    FOR SELECT TO authenticated USING (true);

-- Ensure RLS is enabled
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
```

5. **Click "Run"** to execute

### Option 2: Temporary Workaround (Quick Fix)

If you can't access the Supabase dashboard right now, I can implement a temporary workaround that bypasses RLS for job creation by using the service role in the backend.

## 🧪 Testing

After executing the SQL, the job submission should work without the permission denied error.

## 📋 Files Modified
- `/src/app/dashboard/submit-job/page.tsx` - Fixed job data structure to match database schema
- Enhanced error handling to show actual error messages instead of empty objects

## 🎯 Expected Result
- ✅ Job submission works without permission errors
- ✅ Console shows actual error messages instead of `{}`
- ✅ New customer creation works
- ✅ File uploads work with progress bars