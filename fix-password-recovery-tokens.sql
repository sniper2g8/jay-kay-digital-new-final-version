-- Fix Password Recovery NULL Token Conversion Issues
-- This specifically targets the confirmation_token and related fields causing recovery failures

-- ====================================================================
-- ISSUE ANALYSIS
-- ====================================================================

/*
ERROR: "sql: Scan error on column index 3, name \"confirmation_token\": converting NULL to string is unsupported"

CAUSE: The auth.users table has empty string values in token fields that should be NULL
LOCATION: /recover endpoint when finding users for password reset
IMPACT: Password recovery fails for users with corrupted token fields
*/

-- ====================================================================
-- STEP 1: Identify users with problematic token fields
-- ====================================================================

-- Check current state of auth.users token fields
SELECT 'TOKEN FIELD ANALYSIS' as step;

SELECT 
  id,
  email,
  CASE 
    WHEN confirmation_token = '' THEN 'EMPTY_STRING' 
    WHEN confirmation_token IS NULL THEN 'NULL' 
    ELSE 'HAS_VALUE' 
  END as confirmation_token_status,
  CASE 
    WHEN recovery_token = '' THEN 'EMPTY_STRING' 
    WHEN recovery_token IS NULL THEN 'NULL' 
    ELSE 'HAS_VALUE' 
  END as recovery_token_status,
  CASE 
    WHEN email_change_token_new = '' THEN 'EMPTY_STRING' 
    WHEN email_change_token_new IS NULL THEN 'NULL' 
    ELSE 'HAS_VALUE' 
  END as email_change_token_status
FROM auth.users 
WHERE 
  confirmation_token = '' 
  OR recovery_token = '' 
  OR email_change_token_new = ''
  OR email_change_token_current = ''
ORDER BY email;

-- ====================================================================
-- STEP 2: Fix confirmation_token (the main culprit)
-- ====================================================================

-- Clean confirmation_token field
UPDATE auth.users 
SET confirmation_token = NULL 
WHERE confirmation_token = '';

-- Verify confirmation_token fix
SELECT 'CONFIRMATION_TOKEN_FIX_VERIFICATION' as step;
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN confirmation_token = '' THEN 1 END) as empty_string_tokens,
  COUNT(CASE WHEN confirmation_token IS NULL THEN 1 END) as null_tokens,
  COUNT(CASE WHEN confirmation_token IS NOT NULL AND confirmation_token != '' THEN 1 END) as valid_tokens
FROM auth.users;

-- ====================================================================
-- STEP 3: Fix all other token fields for consistency
-- ====================================================================

-- Clean recovery_token field
UPDATE auth.users 
SET recovery_token = NULL 
WHERE recovery_token = '';

-- Clean email change tokens
UPDATE auth.users 
SET email_change_token_new = NULL 
WHERE email_change_token_new = '';

UPDATE auth.users 
SET email_change_token_current = NULL 
WHERE email_change_token_current = '';

-- Clean phone change tokens
UPDATE auth.users 
SET phone_change_token = NULL 
WHERE phone_change_token = '';

-- ====================================================================
-- STEP 4: Verification - All token fields should be NULL or valid
-- ====================================================================

SELECT 'FINAL_TOKEN_CLEANUP_VERIFICATION' as step;

-- Check all token fields are properly cleaned
SELECT 
  'Token Field Summary' as summary,
  COUNT(*) as total_users,
  COUNT(CASE WHEN confirmation_token = '' THEN 1 END) as bad_confirmation_tokens,
  COUNT(CASE WHEN recovery_token = '' THEN 1 END) as bad_recovery_tokens,
  COUNT(CASE WHEN email_change_token_new = '' THEN 1 END) as bad_email_change_tokens,
  COUNT(CASE WHEN phone_change_token = '' THEN 1 END) as bad_phone_change_tokens
FROM auth.users;

-- Show sample of cleaned users
SELECT 'SAMPLE_CLEANED_USERS' as step;
SELECT 
  email,
  confirmation_token IS NULL as confirmation_token_is_null,
  recovery_token IS NULL as recovery_token_is_null,
  email_change_token_new IS NULL as email_change_token_is_null
FROM auth.users 
WHERE email IN ('admin@jaykaydigitalpress.com', 'hello@ishmaelbull.xyz')
ORDER BY email;

SELECT '✅ Password recovery token cleanup complete!' as result;