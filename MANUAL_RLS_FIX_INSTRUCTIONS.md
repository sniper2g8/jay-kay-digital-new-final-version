# Manual RLS Policy Fix Instructions

This document provides step-by-step instructions to manually apply Row Level Security (RLS) policies to fix notification permission issues in the Jay Kay Digital Press application.

## Prerequisites

1. Access to the Supabase project dashboard
2. Project reference ID: `pnoxqzlxfuvjvufdjuqh`
3. Admin credentials for the Supabase project

## Step-by-Step Instructions

### 1. Access Supabase Dashboard

1. Go to https://app.supabase.com/
2. Sign in with your admin credentials
3. Select the project `pnoxqzlxfuvjvufdjuqh`

### 2. Fix Notifications Table RLS Policies

1. Navigate to **Database** > **Tables**
2. Click on the `notifications` table
3. Go to the **Policies** tab
4. If RLS is not enabled, click **"Enable Row Level Security"**
5. Click **"Add policy"** and add the following policies:

#### Policy 1: SELECT (Read)
- **Name**: Users can read their own notifications
- **Operation**: SELECT
- **Using**: `recipient_id = auth.uid()`

#### Policy 2: INSERT (Create)
- **Name**: Users can insert notifications
- **Operation**: INSERT
- **With Check**: `recipient_id = auth.uid() OR recipient_id IS NULL`

#### Policy 3: UPDATE (Update)
- **Name**: Users can update their own notifications
- **Operation**: UPDATE
- **Using**: `recipient_id = auth.uid()`

#### Policy 4: DELETE (Delete)
- **Name**: Users can delete their own notifications
- **Operation**: DELETE
- **Using**: `recipient_id = auth.uid()`

### 3. Fix appUsers Table RLS Policies

1. Navigate back to **Database** > **Tables**
2. Click on the `appUsers` table
3. Go to the **Policies** tab
4. If RLS is not enabled, click **"Enable Row Level Security"**
5. Click **"Add policy"** and add the following policies:

#### Policy 1: Admin Access
- **Name**: Admins can view all users
- **Operation**: SELECT
- **Using**: `EXISTS ( SELECT 1 FROM appUsers au WHERE au.id = auth.uid() AND au.primary_role = 'admin' )`

#### Policy 2: User Self-Access
- **Name**: Users can view own record
- **Operation**: SELECT
- **Using**: `id = auth.uid()`

### 4. Fix notification_preferences Table RLS Policies

1. Navigate back to **Database** > **Tables**
2. Click on the `notification_preferences` table
3. Go to the **Policies** tab
4. If RLS is not enabled, click **"Enable Row Level Security"**
5. Click **"Add policy"** and add the following policy:

#### Policy 1: User Access
- **Name**: Users can manage own preferences
- **Operation**: ALL
- **Using**: `user_id = auth.uid()`

### 5. Grant Permissions

For each table (`notifications`, `appUsers`, `notification_preferences`):

1. Go to the **Table** view
2. Click on the **Permissions** tab
3. Ensure the `authenticated` role has ALL permissions (SELECT, INSERT, UPDATE, DELETE)

## Verification Steps

After applying the policies, verify they work by:

1. Running the test script:
   ```bash
   node final-email-notification-test.cjs
   ```

2. Testing the notifications page: `/dashboard/notifications`

3. Checking that no "Permission denied" errors appear in the console

## Troubleshooting

### If Permission Errors Persist

1. Double-check that all policies have been applied correctly
2. Verify the service role key in `.env.local` is correct:
   ```
   SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
   ```

3. Check that the `recipient_id` column exists and is properly populated in notifications

### If Email Notifications Still Fail

1. Verify the Resend API key in `.env.local`:
   ```
   RESEND_API_KEY=re_...
   ```

2. Check that the email service is properly configured

3. Review server logs for detailed error information

## Additional Notes

- The `auth.uid()` function returns the ID of the currently authenticated user
- Policies ensure users can only access records where `recipient_id` matches their user ID
- The INSERT policy allows `recipient_id` to be NULL to support system-generated notifications
- Admin users can access all records through the EXISTS clause in the appUsers policy

## Support

If you continue to experience issues after following these instructions, please contact the development team for further assistance.