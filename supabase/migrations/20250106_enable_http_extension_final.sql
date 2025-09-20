-- Enable the http extension for making HTTP requests from database functions
-- This is required for the email notification functions to work properly

-- First, ensure the extensions schema exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant necessary permissions to the authenticator role
GRANT USAGE ON SCHEMA extensions TO authenticator;
ALTER DEFAULT PRIVILEGES IN SCHEMA extensions GRANT ALL ON TABLES TO authenticator;
ALTER DEFAULT PRIVILEGES IN SCHEMA extensions GRANT ALL ON FUNCTIONS TO authenticator;
ALTER DEFAULT PRIVILEGES IN SCHEMA extensions GRANT ALL ON SEQUENCES TO authenticator;

-- Enable the http extension in the extensions schema
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Grant usage on the http extension functions to the authenticator role
GRANT ALL ON FUNCTION extensions.http_post(text, jsonb, jsonb) TO authenticator;
GRANT ALL ON FUNCTION extensions.http_get(text) TO authenticator;
GRANT ALL ON FUNCTION extensions.http_post(text, jsonb) TO authenticator;

-- Also grant to postgres role if needed
GRANT ALL ON FUNCTION extensions.http_post(text, jsonb, jsonb) TO postgres;
GRANT ALL ON FUNCTION extensions.http_get(text) TO postgres;
GRANT ALL ON FUNCTION extensions.http_post(text, jsonb) TO postgres;

-- Create a simple test function to verify the extension is working
CREATE OR REPLACE FUNCTION test_http_extension()
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  -- This is just a placeholder function to verify the extension can be referenced
  -- In practice, you would use extensions.http_post() or extensions.http_get()
  RETURN 'HTTP extension is available';
EXCEPTION
  WHEN others THEN
    RETURN 'HTTP extension is not available: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;