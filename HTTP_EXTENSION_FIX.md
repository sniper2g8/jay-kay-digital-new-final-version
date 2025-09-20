# HTTP Extension Fix for Supabase Database

## Problem
You encountered the error: `schema "net" does not exist` when trying to update job status. This error occurs because the database functions are trying to call `net.http_post()` but the `http` extension hasn't been enabled in your Supabase database.

## Root Cause
The email notification functions in your database migrations use `net.http_post()` to make HTTP requests to Supabase Edge Functions. However, the `net` schema doesn't exist because the `http` extension hasn't been installed and configured properly.

## Solution
I've implemented a complete fix that includes:

### 1. Created a new migration to enable the HTTP extension
- File: `supabase/migrations/20250102_enable_http_extension.sql`
- Creates the `extensions` schema if it doesn't exist
- Enables the `http` extension with the correct schema
- Grants proper permissions to database roles

### 2. Updated existing migrations to use the correct schema
- Updated `supabase/migrations/20241231_email_notifications.sql`
- Updated `supabase/migrations/20250101_update_email_notifications.sql`
- Changed all `net.http_post()` calls to `extensions.http_post()`

### 3. Created helper scripts
- `apply-http-extension-fix.js` - Applies the fix directly to your database
- `test-http-extension.js` - Verifies the HTTP extension is working
- `run-email-fix-migrations.js` - Runs all migrations in the correct order

## How to Apply the Fix

### Option 1: Run the automated script (Recommended)
```bash
node apply-http-extension-fix.js
```

### Option 2: Run the migrations manually
1. First, run the HTTP extension migration:
   ```sql
   CREATE SCHEMA IF NOT EXISTS extensions;
   CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
   GRANT USAGE ON SCHEMA extensions TO authenticator;
   GRANT USAGE ON SCHEMA extensions TO service_role;
   GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO authenticator;
   GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO service_role;
   ```

2. Then update your notification functions to use `extensions.http_post` instead of `net.http_post`.

### Option 3: Use Supabase CLI
```bash
supabase db push
```

## Verification
After applying the fix, you can verify it worked by:

1. Running the test script:
   ```bash
   node test-http-extension.js
   ```

2. Testing job status updates in your application

3. Checking Supabase database logs for any remaining errors

## Additional Notes
- The fix maintains backward compatibility
- No existing data will be affected
- The changes only affect database functions, not application code
- You may need to redeploy your Supabase functions after applying the fix

## Troubleshooting
If you continue to experience issues:

1. Check that the HTTP extension is properly installed
2. Verify that functions use `extensions.http_post` not `net.http_post`
3. Ensure your Supabase service role key is correctly configured
4. Check that your Edge Functions are deployed and working correctly