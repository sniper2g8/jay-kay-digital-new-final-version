# Manual Auth Token Fix Instructions

Since the automated scripts are having issues with your Supabase setup, here's how to manually fix the auth token NULL conversion error.

## Step-by-Step Instructions

### 1. Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar

### 2. Run the Fix Query
Copy and paste the following SQL query into the editor:

```sql
-- Fix for "converting NULL to string is unsupported" error
-- This converts empty string tokens to proper NULL values

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

-- Verify the fix worked
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN confirmation_token = '' THEN 1 END) as empty_confirmation_tokens,
  COUNT(CASE WHEN recovery_token = '' THEN 1 END) as empty_recovery_tokens,
  COUNT(CASE WHEN confirmation_token IS NULL THEN 1 END) as null_confirmation_tokens,
  COUNT(CASE WHEN recovery_token IS NULL THEN 1 END) as null_recovery_tokens
FROM auth.users;
```

### 3. Execute the Query
1. Click the "RUN" button
2. Check the results - you should see a message indicating how many rows were updated

### 4. Verify the Results
The verification query at the end will show you:
- Total number of users
- Count of empty string tokens (should be 0 after the fix)
- Count of NULL tokens (should match the number of previously empty tokens)

### 5. Test Authentication
Try logging into your application to verify the fix worked.

## What This Fix Does

This fix addresses the specific error:
```
error finding user: sql: Scan error on column index 3, name "confirmation_token": converting NULL to string is unsupported
```

The issue occurs when auth tokens are stored as empty strings (`''`) instead of proper NULL values. The Go SQL driver in Supabase's auth system cannot convert NULL database values to string fields when they're expected to be strings.

By converting all empty string tokens to NULL values, we resolve this conversion error.

## Prevention

To prevent this issue from recurring, you can create a trigger function that automatically converts empty strings to NULL values:

```sql
-- Optional: Create a trigger to prevent future issues
CREATE OR REPLACE FUNCTION public.ensure_null_auth_tokens()
RETURNS trigger AS $$
BEGIN
  -- Convert empty strings to NULL for all auth token fields
  NEW.confirmation_token = NULLIF(NEW.confirmation_token, '');
  NEW.recovery_token = NULLIF(NEW.recovery_token, '');
  NEW.email_change_token_new = NULLIF(NEW.email_change_token_new, '');
  NEW.email_change_token_current = NULLIF(NEW.email_change_token_current, '');
  NEW.phone_change_token = NULLIF(NEW.phone_change_token, '');
  NEW.reauthentication_token = NULLIF(NEW.reauthentication_token, '');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers (uncomment if you want to enable this)
-- CREATE TRIGGER ensure_null_auth_tokens_insert
--   BEFORE INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION public.ensure_null_auth_tokens();

-- CREATE TRIGGER ensure_null_auth_tokens_update
--   BEFORE UPDATE ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION public.ensure_null_auth_tokens();
```

## Troubleshooting

If you still experience issues after running the fix:

1. Check Supabase logs for any remaining errors
2. Verify your environment variables are correctly set
3. Ensure your Supabase project is properly configured
4. Check if there are any RLS (Row Level Security) policies affecting auth tables

The fix should resolve the specific "converting NULL to string is unsupported" error you've been experiencing.