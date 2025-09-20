-- Enable the http extension for making HTTP requests from database triggers
-- This is required for the email notification functions to work properly

-- Create the extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Enable the http extension
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Grant usage on the extensions schema to the authenticator role
-- This is needed for the functions to access the http extension
GRANT USAGE ON SCHEMA extensions TO authenticator;

-- Grant execute permission on the http_post function to the authenticator role
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO authenticator;

-- Also grant to service_role for good measure
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO service_role;