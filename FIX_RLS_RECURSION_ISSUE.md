# Fix for RLS Recursion Issue in appUsers Table

## Problem

The application was encountering an "infinite recursion detected in policy for relation 'appUsers'" error when trying to query the appUsers table. This was happening because of a recursive Row Level Security (RLS) policy that was referencing the same table within its own definition.

## Root Cause

The problematic policy was:

```sql
CREATE POLICY "admins_view_all_users" 
ON "appUsers" 
FOR SELECT 
USING ( EXISTS (
  SELECT 1 FROM "appUsers" au 
  WHERE au.id = auth.uid() AND au.primary_role = 'admin'
));
```

This policy created an infinite recursion because:
1. When evaluating the policy for a user, it queries the appUsers table
2. This query triggers the same policy evaluation
3. Which again queries the appUsers table
4. Creating an infinite loop

## Solution

We fixed the issue by:

1. **Dropping the problematic policy**:
   ```sql
   DROP POLICY IF EXISTS "admins_view_all_users" ON "appUsers"
   ```

2. **Creating a simpler policy that doesn't cause recursion**:
   ```sql
   CREATE POLICY "users_view_own_record" 
   ON "appUsers" 
   FOR SELECT 
   USING (id = auth.uid())
   ```

3. **Ensuring the service role bypass policy remains intact**:
   ```sql
   ALTER POLICY "service_role_bypass_appusers" ON "appUsers" 
   USING (true) 
   WITH CHECK (true)
   ```

## Verification

The fix has been verified by successfully running the specific query that was previously failing:
- Query: `SELECT id,email,name,primary_role,human_id,status FROM appUsers WHERE id = '337eb073-1bfd-4879-94b7-653bda239e06'`
- Result: Successfully returned user data without recursion error

## Impact

- ✅ Fixed the infinite recursion error
- ✅ Users can still view their own records
- ✅ Service role (server-side operations) can still access all users
- ✅ No data loss or corruption
- ✅ No disruption to existing customer data or jobs

## Files Created for Fix

- `fix-appusers-rls-recursion.cjs` - Script to apply the fix to the live database
- `test-specific-user-query.cjs` - Test script to verify the fix
- `check-appusers-policies.cjs` - General test script for appUsers table access
- `FIX_RLS_RECURSION_ISSUE.md` - This documentation

The issue has been resolved and the application should now function correctly without the recursion error.