-- migrations/fix_invoice_status_history_trigger.sql

-- The previous attempt to fix the RLS policy did not work because the issue
-- is related to the execution context of the trigger.
-- This script modifies the trigger function to run with SECURITY DEFINER,
-- which executes it with the privileges of the user who created it (the owner),
-- thus bypassing RLS for the user who triggered the action.

-- Drop the existing trigger and function to redefine them
DROP TRIGGER IF EXISTS track_invoice_status_changes_trigger ON public.invoices;
DROP FUNCTION IF EXISTS public.track_invoice_status_changes();

-- Recreate the function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.track_invoice_status_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only create a history entry if the status has actually changed
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
      auth.uid(), -- Use the ID of the user who initiated the change
      'Status updated via application'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger on the invoices table
CREATE TRIGGER track_invoice_status_changes_trigger
AFTER UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.track_invoice_status_changes();

-- Optional: To be safe, let's also ensure a permissive policy for service_role,
-- although SECURITY DEFINER should be the primary fix.
DROP POLICY IF EXISTS "Allow service_role to insert history" ON public.invoice_status_history;
CREATE POLICY "Allow service_role to insert history"
ON public.invoice_status_history
FOR INSERT
TO service_role
WITH CHECK (true);
