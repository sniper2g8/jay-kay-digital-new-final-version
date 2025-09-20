-- Enable HTTP extension properly for Supabase
-- This migration ensures the HTTP extension is correctly enabled

-- First, check if the extensions schema exists, create if not
CREATE SCHEMA IF NOT EXISTS extensions;

-- Enable the HTTP extension in the extensions schema
-- Note: This may require contacting Supabase support if you're on a free tier
CREATE EXTENSION IF NOT EXISTS http SCHEMA extensions;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Test the extension (this will help verify it's working)
-- SELECT extensions.http_post('https://httpbin.org/post', '{}', '{}');

-- Update the notification functions to use the extensions schema
-- This is a safety check to ensure they're using the correct schema

-- Update notify_job_status_change function
CREATE OR REPLACE FUNCTION notify_job_status_change()
RETURNS TRIGGER AS $$
DECLARE
  customer_email TEXT;
  customer_name TEXT;
  job_title TEXT;
  previous_status TEXT;
BEGIN
  -- Get customer email and name from the customers table
  SELECT 
    c.email, 
    c.business_name,
    NEW.title
  INTO customer_email, customer_name, job_title
  FROM customers c
  WHERE c.id = NEW.customer_id;

  -- If no business name, try to get from contact info
  IF customer_name IS NULL AND customer_email IS NOT NULL THEN
    customer_name := split_part(customer_email, '@', 1);
  END IF;

  -- Get previous status if this is an update
  IF TG_OP = 'UPDATE' THEN
    previous_status := OLD.status;
  END IF;

  -- Only trigger if status actually changed and we have customer email
  IF (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) 
     AND customer_email IS NOT NULL THEN
    
    -- Call the Edge Function via HTTP request
    -- Note: If HTTP extension is not available, this will fail
    -- In that case, you'll need to use application-level notifications
    PERFORM
      extensions.http_post(
        url := 'https://pnoxqzlxfuvjvufdjuqh.supabase.co/functions/v1/email-notifications',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'type', CASE 
            WHEN TG_OP = 'INSERT' THEN 'job_created'
            ELSE 'job_status_change'
          END,
          'recipientEmail', customer_email,
          'recipientName', customer_name,
          'data', jsonb_build_object(
            'jobId', NEW.id::text,
            'jobTitle', job_title,
            'status', NEW.status,
            'previousStatus', previous_status
          )
        )
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update notify_payment_received function
CREATE OR REPLACE FUNCTION notify_payment_received()
RETURNS TRIGGER AS $$
DECLARE
  customer_email TEXT;
  customer_name TEXT;
BEGIN
  -- Get customer email and name
  SELECT 
    c.email, 
    c.business_name
  INTO customer_email, customer_name
  FROM customers c
  WHERE c.id = NEW.customer_id;

  -- If no business name, try to get from contact info
  IF customer_name IS NULL AND customer_email IS NOT NULL THEN
    customer_name := split_part(customer_email, '@', 1);
  END IF;

  -- Only trigger if we have customer email and payment is confirmed
  IF customer_email IS NOT NULL AND NEW.status = 'paid' THEN
    
    -- Call the Edge Function via HTTP request
    PERFORM
      extensions.http_post(
        url := 'https://pnoxqzlxfuvjvufdjuqh.supabase.co/functions/v1/email-notifications',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'type', 'payment_received',
          'recipientEmail', customer_email,
          'recipientName', customer_name,
          'data', jsonb_build_object(
            'paymentAmount', NEW.amount,
            'paymentDate', NEW.created_at::date
          )
        )
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;