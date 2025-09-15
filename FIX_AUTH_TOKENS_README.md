# Fix for Supabase Auth Token NULL Conversion Error

## Problem Description

This fix addresses the following error that occurs during authentication:

```
error finding user: sql: Scan error on column index 3, name "confirmation_token": converting NULL to string is unsupported
```

This error occurs when the Supabase authentication system tries to scan NULL values from database columns into string fields, which is not supported.

## Root Cause

The issue is caused by auth tokens being stored as empty strings (`''`) instead of proper NULL values in the `auth.users` table. When the Go SQL driver tries to scan these values, it cannot convert NULL to string, resulting in the error.

## Solutions Provided

### 1. Simple SQL Fix (Recommended for direct use in Supabase Dashboard)

File: `fix-null-tokens-simple.sql`

This contains a simple SQL script that can be run directly in the Supabase SQL Editor:

```sql
-- Convert empty string tokens to NULL
UPDATE auth.users 
SET 
  confirmation_token = NULLIF(confirmation_token, ''),
  recovery_token = NULLIF(recovery_token, ''),
  email_change_token_new = NULLIF(email_change_token_new, ''),
  email_change_token_current = NULLIF(email_change_token_current, ''),
  phone_change_token = NULLIF(phone_change_token, ''),
  reauthentication_token = NULLIF(reauthentication_token, '')
WHERE 
  confirmation_token = '' 
  OR recovery_token = '' 
  OR email_change_token_new = '' 
  OR email_change_token_current = '' 
  OR phone_change_token = ''
  OR reauthentication_token = '';
```

### 2. Comprehensive SQL Fix

File: `fix-auth-tokens-null-issue.sql`

This is a more comprehensive fix that:
1. Checks the current state of auth tokens
2. Identifies problematic records
3. Fixes the tokens by converting empty strings to NULL
4. Creates database triggers to prevent future issues
5. Verifies the fix worked

### 3. JavaScript Automation Script

File: `scripts/fix-null-token-issue.js`

This script automates the execution of the SQL fix.

## How to Apply the Fix

### Option 1: Direct SQL Execution (Easiest)

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `fix-null-tokens-simple.sql`
4. Run the query

### Option 2: Manual SQL Execution (If automation fails)

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and paste the SQL from `MANUAL_AUTH_FIX_INSTRUCTIONS.md`
4. Run the query

### Option 3: Using the Automation Script

1. Make sure your `.env.local` file has the required environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Run the fix script:
   ```bash
   npm run fix:auth-tokens
   ```

### Option 4: Manual SQL Execution

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `fix-auth-tokens-null-issue.sql`
4. Run the query

## Prevention

The comprehensive fix includes database triggers that automatically convert empty string tokens to NULL values, preventing this issue from recurring.

## Verification

After applying the fix, you can verify it worked by running:

```sql
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN confirmation_token IS NULL THEN 1 END) as null_confirmation_tokens
FROM auth.users;
```

All tokens should now be properly stored as NULL instead of empty strings.