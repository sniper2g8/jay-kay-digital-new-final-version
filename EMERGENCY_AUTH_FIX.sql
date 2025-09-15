-- EMERGENCY FIX for Supabase Auth Token NULL Conversion Error
-- RUN THIS DIRECTLY IN YOUR SUPABASE SQL EDITOR

-- This fixes the specific error:
-- "error finding user: sql: Scan error on column index 3, name "confirmation_token": converting NULL to string is unsupported"

-- STEP 1: Fix the immediate issue by converting empty string tokens to NULL
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

-- STEP 2: Verify the fix worked
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN confirmation_token = '' THEN 1 END) as empty_confirmation_tokens,
  COUNT(CASE WHEN recovery_token = '' THEN 1 END) as empty_recovery_tokens,
  COUNT(CASE WHEN confirmation_token IS NULL THEN 1 END) as null_confirmation_tokens,
  COUNT(CASE WHEN recovery_token IS NULL THEN 1 END) as null_recovery_tokens
FROM auth.users;

-- If the fix worked, you should see:
-- - empty_confirmation_tokens: 0
-- - empty_recovery_tokens: 0
-- - null_confirmation_tokens: increased by the number of previously empty tokens