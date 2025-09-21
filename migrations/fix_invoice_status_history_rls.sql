-- Fix RLS policy for invoice_status_history to allow inserts from authenticated users,
-- which is necessary for the track_invoice_status_changes trigger.

-- Drop the existing insert policy
DROP POLICY IF EXISTS "Authenticated users can insert invoice status history" ON public.invoice_status_history;

-- Create a new policy that allows any authenticated user to insert
CREATE POLICY "Authenticated users can insert invoice status history"
ON public.invoice_status_history
FOR INSERT
TO authenticated
WITH CHECK (true);
