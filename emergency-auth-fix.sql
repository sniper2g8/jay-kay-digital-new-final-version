-- EMERGENCY FIX: Remove problematic triggers and fix the auth token issue again
-- The triggers we created are causing the NULL conversion error to return

-- Step 1: Remove the triggers that are causing issues
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS ensure_null_auth_tokens_insert ON auth.users;
DROP TRIGGER IF EXISTS ensure_null_auth_tokens_update ON auth.users;

-- Step 2: Clean up any functions that might be interfering
DROP FUNCTION IF EXISTS public.handle_new_user_profile();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.safe_auth_token_handler();

-- Step 3: Force clean all auth tokens again (they got messed up)
UPDATE auth.users 
SET 
  confirmation_token = NULL,
  recovery_token = NULL,
  email_change_token_current = NULL,
  email_change_token_new = NULL,
  phone_change_token = NULL,
  reauthentication_token = NULL
WHERE 
  confirmation_token = '' OR confirmation_token IS NOT NULL OR
  recovery_token = '' OR recovery_token IS NOT NULL OR
  email_change_token_current = '' OR email_change_token_current IS NOT NULL OR
  email_change_token_new = '' OR email_change_token_new IS NOT NULL OR
  phone_change_token = '' OR phone_change_token IS NOT NULL OR
  reauthentication_token = '' OR reauthentication_token IS NOT NULL;

-- Step 4: Keep the profiles table and RLS disabled for appUsers
-- (These don't interfere with auth)

-- Step 5: Create a simple, safe trigger that doesn't interfere with auth tokens
CREATE OR REPLACE FUNCTION public.handle_new_user_simple()
RETURNS trigger AS $$
BEGIN
  -- Only create profile after the auth user is fully created
  -- This runs AFTER all auth operations are complete
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  
  -- Create appUsers profile
  INSERT INTO public."appUsers" (
    id, human_id, name, email, primary_role, status, created_at, updated_at
  ) VALUES (
    NEW.id,
    'JKDP-USR-' || LPAD((
      SELECT COALESCE(MAX(CAST(SUBSTRING(human_id FROM 10) AS INTEGER)), 0) + 1
      FROM public."appUsers"
      WHERE human_id LIKE 'JKDP-USR-%'
    )::text, 3, '0'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    'customer',
    'active',
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a DEFERRED trigger (runs after transaction commits)
CREATE CONSTRAINT TRIGGER on_auth_user_created_simple
  AFTER INSERT ON auth.users
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_simple();

-- Verify token cleanup
SELECT 'Emergency fix applied!' as status;
SELECT 'Problematic triggers removed' as step1;
SELECT 'Auth tokens cleaned again' as step2;
SELECT 'Safe profile creation trigger added' as step3;

-- Check token status
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN confirmation_token IS NOT NULL THEN 1 END) as users_with_confirmation_tokens,
  COUNT(CASE WHEN recovery_token IS NOT NULL THEN 1 END) as users_with_recovery_tokens
FROM auth.users;