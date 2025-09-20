# Database Connection and RLS Fix Guide

## Overview
This guide helps you diagnose and fix the RLS (Row Level Security) issues in your Supabase database that are causing "permission denied" errors in your application.

## Current Status
Based on our checks, we've identified:
1. **Direct database connection works** - Using the DATABASE_URL from .env.local
2. **RLS is enabled** on the jobs table
3. **All necessary policies have been applied** to the jobs table
4. **The appUsers table exists** with the correct structure and has users with roles

## Solution Verification

### Step 1: Verify All Policies Are in Place

Run the verification script:
```bash
node check-existing-policies.js
```

You should see all four policies:
- Users can read jobs (SELECT)
- Users can update jobs (UPDATE)
- Staff can create jobs (INSERT)
- Admins can delete jobs (DELETE)

### Step 2: Authentication Requirement

The policies are now correctly configured, but they require users to be authenticated. The application must ensure users are properly logged in for the policies to work.

## Files in This Directory

1. `check-db-connection.js` - Checks direct database connection using DATABASE_URL
2. `verify-jobs-rls-direct.js` - Verifies RLS status using direct database connection
3. `check-rls-supabase-client.js` - Verifies RLS status using Supabase client (reproduces the error)
4. `check-existing-policies.js` - Checks existing policies on the jobs table
5. `check-update-policy-details.js` - Checks details of UPDATE policy
6. `test-individual-policies.js` - Tests each policy individually
7. `comprehensive-policy-fix.sql` - Comprehensive fix for all policies
8. `apply-policies-manually.js` - Script to manually apply missing policies
9. `check-user-authentication.js` - Checks if user is properly authenticated

## Troubleshooting

### If you still see permission errors:

1. Make sure users are properly authenticated in the application
2. Check that users have the correct roles in the appUsers table
3. Verify the policies are correctly applied:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'jobs';
   ```

## Environment Variables Used

The scripts use these environment variables from `.env.local`:
- `DATABASE_URL` - For direct PostgreSQL connection
- `NEXT_PUBLIC_SUPABASE_URL` - For Supabase client connection
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - For Supabase client authentication

## Additional Notes

- The `appUsers` table name requires quotes due to case sensitivity
- Available roles in your system: super_admin, admin, manager, staff, customer
- The policies ensure appropriate access control based on user roles
- The `auth.role() = 'authenticated'` check ensures only logged-in users can perform operations
- The `auth.uid()` function returns the ID of the currently authenticated user
- All four policies (SELECT, INSERT, UPDATE, DELETE) are now correctly configured
- Authentication is required for the policies to work properly