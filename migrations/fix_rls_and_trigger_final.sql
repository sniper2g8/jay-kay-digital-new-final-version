-- migrations/fix_rls_and_trigger_final.sql

-- This script provides a definitive fix for the "permission denied" error on the
-- invoice_status_history table. It ensures the trigger function has the correct
-- ownership and permissions to execute successfully.

-- Step 1: Drop the existing trigger and function to avoid conflicts.
DROP TRIGGER IF EXISTS track_invoice_status_changes_trigger ON public.invoices;
DROP FUNCTION IF EXISTS public.track_invoice_status_changes();

-- Step 2: Recreate the function with the necessary security settings.
CREATE OR REPLACE FUNCTION public.track_invoice_status_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
-- SECURITY DEFINER makes the function execute with the permissions of the user who created it (the owner).
-- This is crucial for allowing it to bypass the invoker's RLS.
SECURITY DEFINER
-- Set a specific search path to ensure the function knows where to find tables.
SET search_path = public
AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Attempt to get the current user's ID. This might be null if run by a system process.
  user_id := auth.uid();

  -- Only create a history entry if the status has actually changed.
  IF OLD.invoice_status IS DISTINCT FROM NEW.invoice_status THEN
    INSERT INTO public.invoice_status_history (
      invoice_id,
      status_from,
      status_to,
      changed_by,
      reason
    ) VALUES (
      NEW.id,
      OLD.invoice_status,
      NEW.invoice_status,
      user_id, -- Insert the user_id, which may be null.
      'Status updated'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 3: Set the owner of the function to the 'postgres' superuser.
-- This ensures the SECURITY DEFINER context has maximum privileges.
ALTER FUNCTION public.track_invoice_status_changes() OWNER TO postgres;

-- Step 4: Grant execution permission on the function to the necessary roles.
-- This allows 'service_role' (used by server actions) and 'authenticated' users to call this function.
GRANT EXECUTE ON FUNCTION public.track_invoice_status_changes() TO service_role, authenticated;

-- Step 5: Recreate the trigger on the invoices table.
CREATE TRIGGER track_invoice_status_changes_trigger
AFTER UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.track_invoice_status_changes();

-- Step 6: Ensure a permissive INSERT policy for the service_role as a failsafe.
DROP POLICY IF EXISTS "Allow service_role to insert history" ON public.invoice_status_history;
CREATE POLICY "Allow service_role to insert history"
ON public.invoice_status_history
FOR INSERT
TO service_role
WITH CHECK (true);
