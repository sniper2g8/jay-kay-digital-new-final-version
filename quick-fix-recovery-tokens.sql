-- Quick fix for password recovery token issues
-- Run this directly in Supabase SQL Editor

-- Check current problem
SELECT 'BEFORE FIX - Problem Analysis' as step;
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN confirmation_token = '' THEN 1 END) as empty_confirmation_tokens,
  COUNT(CASE WHEN recovery_token = '' THEN 1 END) as empty_recovery_tokens
FROM auth.users;

-- Fix the main culprit: confirmation_token
UPDATE auth.users 
SET confirmation_token = NULL 
WHERE confirmation_token = '';

-- Fix recovery_token for good measure
UPDATE auth.users 
SET recovery_token = NULL 
WHERE recovery_token = '';

-- Fix email change tokens
UPDATE auth.users 
SET email_change_token_new = NULL 
WHERE email_change_token_new = '';

UPDATE auth.users 
SET email_change_token_current = NULL 
WHERE email_change_token_current = '';

-- Fix phone change token
UPDATE auth.users 
SET phone_change_token = NULL 
WHERE phone_change_token = '';

-- Verify the fix
SELECT 'AFTER FIX - Verification' as step;
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN confirmation_token = '' THEN 1 END) as empty_confirmation_tokens,
  COUNT(CASE WHEN recovery_token = '' THEN 1 END) as empty_recovery_tokens,
  COUNT(CASE WHEN email_change_token_new = '' THEN 1 END) as empty_email_change_tokens
FROM auth.users;

-- Test specific users
SELECT 'SPECIFIC USER CHECK' as step;
SELECT 
  email,
  CASE WHEN confirmation_token IS NULL THEN '✅ NULL' ELSE '❌ HAS_VALUE' END as confirmation_status,
  CASE WHEN recovery_token IS NULL THEN '✅ NULL' ELSE '❌ HAS_VALUE' END as recovery_status
FROM auth.users 
WHERE email IN ('admin@jaykaydigitalpress.com', 'hello@ishmaelbull.xyz');

SELECT '🎉 Password recovery token cleanup complete! Test password recovery now.' as result;