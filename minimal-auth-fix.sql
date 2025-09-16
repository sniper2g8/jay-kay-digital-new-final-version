-- SAFER Alternative: Minimal Fix for Password Recovery Issue
-- Only touch the specific fields causing the scanning error

-- Check which users are affected by the scanning issue
SELECT 'AFFECTED USERS ANALYSIS' as step;
SELECT 
  email,
  created_at,
  confirmation_token = '' as has_empty_confirmation,
  recovery_token = '' as has_empty_recovery,
  email_change_token_new = '' as has_empty_email_change
FROM auth.users 
WHERE confirmation_token = '' 
   OR recovery_token = ''
   OR email_change_token_new = '';

-- Minimal fix: Only set confirmation_token to NULL (the main culprit)
-- This is the specific field mentioned in the error
UPDATE auth.users 
SET confirmation_token = NULL 
WHERE confirmation_token = '';

-- Optionally, also fix recovery_token since it's related to password recovery
UPDATE auth.users 
SET recovery_token = NULL 
WHERE recovery_token = '';

-- Verification
SELECT 'MINIMAL FIX VERIFICATION' as step;
SELECT 
  email,
  confirmation_token IS NULL as confirmation_is_null,
  recovery_token IS NULL as recovery_is_null,
  email_change_token_new = '' as email_change_still_empty_string
FROM auth.users 
WHERE email IN ('admin@jaykaydigitalpress.com', 'hello@ishmaelbull.xyz');

SELECT 'Minimal fix applied - test password recovery now' as result;