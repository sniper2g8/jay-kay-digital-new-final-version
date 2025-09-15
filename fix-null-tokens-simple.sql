-- Simple Fix for Supabase Auth Token NULL Conversion Error
-- Run this directly in the Supabase SQL Editor

-- Step 1: Fix existing empty string tokens by converting them to NULL
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

-- Step 2: Verify the fix worked
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN confirmation_token IS NULL THEN 1 END) as null_confirmation_tokens,
  COUNT(CASE WHEN recovery_token IS NULL THEN 1 END) as null_recovery_tokens
FROM auth.users;

-- The error "converting NULL to string is unsupported" should now be resolved!