-- Update email_notifications table structure to match current schema
-- Drop existing table and recreate with proper structure
DROP TABLE IF EXISTS email_notifications CASCADE;

CREATE TABLE public.email_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  subject VARCHAR(500) NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
  resend_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'sent',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policy for email_notifications
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Allow service role to insert and read all records
CREATE POLICY "Service role can manage email notifications" ON email_notifications
  FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read their own email notifications
CREATE POLICY "Users can view their own email notifications" ON email_notifications
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    recipient_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_notifications_recipient ON email_notifications(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_notifications_type ON email_notifications(type);
CREATE INDEX IF NOT EXISTS idx_email_notifications_sent_at ON email_notifications(sent_at);

-- Update function to trigger email notifications for job status changes
-- This version works with the existing customers table structure
CREATE OR REPLACE FUNCTION notify_job_status_change()
RETURNS TRIGGER AS $$
DECLARE
  customer_email TEXT;
  customer_name TEXT;
  job_title TEXT;
  previous_status TEXT;
BEGIN
  -- Get customer email and name from the customers table
  -- Adjust this query based on your actual table structure
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
    PERFORM
      net.http_post(
        url := 'https://your-project.supabase.co/functions/v1/email-notifications',
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

-- Create trigger for job status changes
DROP TRIGGER IF EXISTS trigger_job_status_notification ON jobs;
CREATE TRIGGER trigger_job_status_notification
  AFTER INSERT OR UPDATE OF status ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION notify_job_status_change();

-- Function to trigger payment received notifications
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
      net.http_post(
        url := 'https://your-project.supabase.co/functions/v1/email-notifications',
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