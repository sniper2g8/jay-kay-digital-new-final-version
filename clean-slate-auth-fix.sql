-- Simple fix for current issues
-- 1. Fix profiles table permissions
-- 2. Temporarily disable all RLS for testing

-- Disable RLS on profiles table (it's a real table, not a view)
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

-- Make sure appUsers RLS is still disabled
ALTER TABLE public."appUsers" DISABLE ROW LEVEL SECURITY;

-- Drop any problematic policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Remove ALL triggers temporarily to isolate the issue
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_simple ON auth.users;
DROP TRIGGER IF EXISTS ensure_null_auth_tokens_insert ON auth.users;
DROP TRIGGER IF EXISTS ensure_null_auth_tokens_update ON auth.users;

-- Clean functions
DROP FUNCTION IF EXISTS public.handle_new_user_profile();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_user_simple();
DROP FUNCTION IF EXISTS public.safe_auth_token_handler();
DROP FUNCTION IF EXISTS public.ensure_null_auth_tokens();

-- Force clean auth tokens one more time
UPDATE auth.users 
SET 
  confirmation_token = NULL,
  recovery_token = NULL,
  email_change_token_current = NULL,
  email_change_token_new = NULL,
  phone_change_token = NULL,
  reauthentication_token = NULL
WHERE 
  confirmation_token IS NOT NULL OR confirmation_token = '' OR
  recovery_token IS NOT NULL OR recovery_token = '' OR
  email_change_token_current IS NOT NULL OR email_change_token_current = '' OR
  email_change_token_new IS NOT NULL OR email_change_token_new = '' OR
  phone_change_token IS NOT NULL OR phone_change_token = '' OR
  reauthentication_token IS NOT NULL OR reauthentication_token = '';

-- Verify clean state
SELECT 'All triggers and RLS disabled for testing' as status;
SELECT 'Auth tokens cleaned' as tokens;

-- Check current token state
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN confirmation_token IS NOT NULL THEN 1 END) as confirmation_tokens,
  COUNT(CASE WHEN recovery_token IS NOT NULL THEN 1 END) as recovery_tokens,
  COUNT(CASE WHEN email_change_token_current IS NOT NULL THEN 1 END) as email_change_tokens,
  COUNT(CASE WHEN phone_change_token IS NOT NULL THEN 1 END) as phone_change_tokens,
  COUNT(CASE WHEN reauthentication_token IS NOT NULL THEN 1 END) as reauth_tokens
FROM auth.users;

SELECT 'Test authentication now - should work without any triggers or RLS interference' as instruction;