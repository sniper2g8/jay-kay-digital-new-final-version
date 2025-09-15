-- Temporary Workaround for Supabase Auth Token Scanning Issue
-- This sets token columns to empty strings instead of NULL as a temporary fix
-- WARNING: This is a workaround, not a permanent solution

-- Set all NULL tokens to empty strings (workaround for Supabase auth service bug)
UPDATE auth.users 
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE 
  confirmation_token IS NULL 
  OR recovery_token IS NULL 
  OR email_change_token_new IS NULL 
  OR email_change_token_current IS NULL 
  OR phone_change_token IS NULL
  OR reauthentication_token IS NULL;

-- Verify the workaround
SELECT 'Workaround applied - checking token values' as status;

SELECT 
  email,
  CASE WHEN confirmation_token = '' THEN 'EMPTY_STRING' ELSE 'HAS_VALUE' END as confirmation_status,
  CASE WHEN recovery_token = '' THEN 'EMPTY_STRING' ELSE 'HAS_VALUE' END as recovery_status
FROM auth.users 
LIMIT 5;

SELECT 'WARNING: This is a temporary workaround. Contact Supabase Support for permanent fix.' as warning;