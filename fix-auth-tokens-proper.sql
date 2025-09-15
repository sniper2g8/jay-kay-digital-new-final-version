-- Proper Fix for Supabase Auth Token Issue
-- Based on Supabase Support guidance and schema analysis
-- This sets empty string tokens back to NULL (the proper state)

-- Step 1: Check current token state
SELECT 'Current Auth Token State Analysis' as status;

SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN confirmation_token = '' THEN 1 END) as empty_confirmation_tokens,
  COUNT(CASE WHEN recovery_token = '' THEN 1 END) as empty_recovery_tokens,
  COUNT(CASE WHEN email_change_token_new = '' THEN 1 END) as empty_email_change_new_tokens,
  COUNT(CASE WHEN email_change_token_current = '' THEN 1 END) as empty_email_change_current_tokens,
  COUNT(CASE WHEN phone_change_token = '' THEN 1 END) as empty_phone_change_tokens,
  COUNT(CASE WHEN reauthentication_token = '' THEN 1 END) as empty_reauth_tokens
FROM auth.users;

-- Step 2: Fix the empty string tokens by setting them to NULL
-- This is the proper fix - empty strings should be NULL for auth tokens
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

-- Step 3: Verify the fix
SELECT 'After Fix - Token State Analysis' as status;

SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN confirmation_token IS NULL THEN 1 END) as null_confirmation_tokens,
  COUNT(CASE WHEN recovery_token IS NULL THEN 1 END) as null_recovery_tokens,
  COUNT(CASE WHEN email_change_token_new IS NULL THEN 1 END) as null_email_change_new_tokens,
  COUNT(CASE WHEN email_change_token_current IS NULL THEN 1 END) as null_email_change_current_tokens,
  COUNT(CASE WHEN phone_change_token IS NULL THEN 1 END) as null_phone_change_tokens,
  COUNT(CASE WHEN reauthentication_token IS NULL THEN 1 END) as null_reauth_tokens
FROM auth.users;

-- Step 4: Show sample of fixed tokens
SELECT 'Sample of Fixed Users' as status;

SELECT 
  email,
  CASE 
    WHEN confirmation_token IS NULL THEN 'NULL (CORRECT)' 
    WHEN confirmation_token = '' THEN 'EMPTY_STRING (BAD)' 
    ELSE 'HAS_VALUE' 
  END as confirmation_status,
  CASE 
    WHEN recovery_token IS NULL THEN 'NULL (CORRECT)' 
    WHEN recovery_token = '' THEN 'EMPTY_STRING (BAD)' 
    ELSE 'HAS_VALUE' 
  END as recovery_status,
  CASE 
    WHEN phone_change_token IS NULL THEN 'NULL (CORRECT)' 
    WHEN phone_change_token = '' THEN 'EMPTY_STRING (BAD)' 
    ELSE 'HAS_VALUE' 
  END as phone_change_status
FROM auth.users 
LIMIT 5;

SELECT 'Auth token fix completed - tokens set to proper NULL values' as result;