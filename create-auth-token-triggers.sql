-- Create a function to safely handle auth token operations
-- This function will ensure tokens are always NULL instead of empty strings

CREATE OR REPLACE FUNCTION public.safe_auth_token_handler()
RETURNS trigger AS $$
BEGIN
  -- Ensure all auth tokens are NULL instead of empty strings
  IF NEW.confirmation_token = '' THEN
    NEW.confirmation_token := NULL;
  END IF;
  
  IF NEW.recovery_token = '' THEN
    NEW.recovery_token := NULL;
  END IF;
  
  IF NEW.email_change_token_new = '' THEN
    NEW.email_change_token_new := NULL;
  END IF;
  
  IF NEW.email_change_token_current = '' THEN
    NEW.email_change_token_current := NULL;
  END IF;
  
  IF NEW.phone_change_token = '' THEN
    NEW.phone_change_token := NULL;
  END IF;
  
  IF NEW.reauthentication_token = '' THEN
    NEW.reauthentication_token := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically fix tokens on INSERT and UPDATE
DROP TRIGGER IF EXISTS ensure_null_auth_tokens_insert ON auth.users;
CREATE TRIGGER ensure_null_auth_tokens_insert
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.safe_auth_token_handler();

DROP TRIGGER IF EXISTS ensure_null_auth_tokens_update ON auth.users;
CREATE TRIGGER ensure_null_auth_tokens_update
  BEFORE UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.safe_auth_token_handler();

-- Verify triggers are created
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'auth' 
  AND event_object_table = 'users'
  AND trigger_name LIKE '%null_auth_tokens%';

SELECT 'Auth token safety triggers created successfully' as status;