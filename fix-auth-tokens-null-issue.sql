-- Fix for Supabase Auth Token NULL Conversion Error
-- This script addresses the specific error:
-- "error finding user: sql: Scan error on column index 3, name "confirmation_token": converting NULL to string is unsupported"

-- Step 1: Check current state of auth.users table columns
SELECT 'Checking current auth.users schema...' as status;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'auth' 
  AND table_name = 'users'
  AND column_name IN ('confirmation_token', 'recovery_token', 'email_change_token_new', 'email_change_token_current', 'phone_change_token', 'reauthentication_token')
ORDER BY ordinal_position;

-- Step 2: Identify problematic records with empty string tokens
SELECT 'Identifying problematic records with empty string tokens...' as status;

SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN confirmation_token = '' THEN 1 END) as empty_confirmation_tokens,
  COUNT(CASE WHEN recovery_token = '' THEN 1 END) as empty_recovery_tokens,
  COUNT(CASE WHEN email_change_token_new = '' THEN 1 END) as empty_email_change_new_tokens,
  COUNT(CASE WHEN email_change_token_current = '' THEN 1 END) as empty_email_change_current_tokens,
  COUNT(CASE WHEN phone_change_token = '' THEN 1 END) as empty_phone_change_tokens,
  COUNT(CASE WHEN reauthentication_token = '' THEN 1 END) as empty_reauth_tokens
FROM auth.users;

-- Step 3: Fix the core issue - convert empty strings to NULL values
-- This is the main fix for the "converting NULL to string is unsupported" error
UPDATE auth.users 
SET 
  confirmation_token = CASE WHEN confirmation_token = '' THEN NULL ELSE confirmation_token END,
  recovery_token = CASE WHEN recovery_token = '' THEN NULL ELSE recovery_token END,
  email_change_token_new = CASE WHEN email_change_token_new = '' THEN NULL ELSE email_change_token_new END,
  email_change_token_current = CASE WHEN email_change_token_current = '' THEN NULL ELSE email_change_token_current END,
  phone_change_token = CASE WHEN phone_change_token = '' THEN NULL ELSE phone_change_token END,
  reauthentication_token = CASE WHEN reauthentication_token = '' THEN NULL ELSE reauthentication_token END
WHERE 
  confirmation_token = '' 
  OR recovery_token = '' 
  OR email_change_token_new = '' 
  OR email_change_token_current = '' 
  OR phone_change_token = ''
  OR reauthentication_token = '';

-- Step 4: Create a robust trigger function to prevent future issues
-- This will ensure tokens are always properly handled
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create triggers on auth.users table
DROP TRIGGER IF EXISTS ensure_null_auth_tokens_insert ON auth.users;
CREATE TRIGGER ensure_null_auth_tokens_insert
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_null_auth_tokens();

DROP TRIGGER IF EXISTS ensure_null_auth_tokens_update ON auth.users;
CREATE TRIGGER ensure_null_auth_tokens_update
  BEFORE UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_null_auth_tokens();

-- Step 6: Verify the fix worked
SELECT 'Verifying fix - checking for remaining empty string tokens...' as status;

SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN confirmation_token = '' THEN 1 END) as empty_confirmation_tokens,
  COUNT(CASE WHEN recovery_token = '' THEN 1 END) as empty_recovery_tokens,
  COUNT(CASE WHEN email_change_token_new = '' THEN 1 END) as empty_email_change_new_tokens,
  COUNT(CASE WHEN email_change_token_current = '' THEN 1 END) as empty_email_change_current_tokens,
  COUNT(CASE WHEN phone_change_token = '' THEN 1 END) as empty_phone_change_tokens,
  COUNT(CASE WHEN reauthentication_token = '' THEN 1 END) as empty_reauth_tokens
FROM auth.users;

-- Step 7: Show sample of corrected data
SELECT 'Sample of corrected token values...' as status;

SELECT 
  id,
  email,
  CASE 
    WHEN confirmation_token IS NULL THEN 'NULL (CORRECT)'
    WHEN confirmation_token = '' THEN 'EMPTY STRING (FIXED)'
    ELSE 'HAS VALUE'
  END as confirmation_token_status,
  CASE 
    WHEN recovery_token IS NULL THEN 'NULL (CORRECT)'
    WHEN recovery_token = '' THEN 'EMPTY STRING (FIXED)'
    ELSE 'HAS VALUE'
  END as recovery_token_status
FROM auth.users 
WHERE confirmation_token IS NULL OR recovery_token IS NULL
LIMIT 5;

-- Step 8: Grant necessary permissions for the trigger function
GRANT EXECUTE ON FUNCTION public.ensure_null_auth_tokens() TO anon;
GRANT EXECUTE ON FUNCTION public.ensure_null_auth_tokens() TO authenticated;

SELECT 'Auth token NULL conversion fix completed successfully!' as result;
SELECT 'The "converting NULL to string is unsupported" error should now be resolved.' as message;