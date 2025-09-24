-- Ensure roles can use the invoice_items_id_seq sequence

-- Grant to authenticated users (client-side inserts)
GRANT USAGE, SELECT ON SEQUENCE public.invoice_items_id_seq TO authenticated;

-- Grant to service_role (server-side/admin operations)
GRANT USAGE, SELECT ON SEQUENCE public.invoice_items_id_seq TO service_role;

-- Optionally, if anon needs read access (not typical for inserts)
-- GRANT USAGE, SELECT ON SEQUENCE public.invoice_items_id_seq TO anon;


