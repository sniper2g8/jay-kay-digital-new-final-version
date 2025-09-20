-- Fallback migration for application-level notifications
-- This migration removes the HTTP calls and relies on application-level notifications

-- Simplified notify_job_status_change function (no HTTP calls)
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
    
    -- Instead of making an HTTP call, we'll just log that a notification should be sent
    -- The actual notification will be sent by the application layer
    INSERT INTO email_notifications (
      type, 
      recipient_email, 
      recipient_name, 
      subject, 
      sent_at,
      metadata
    ) VALUES (
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'job_created'
        ELSE 'job_status_change'
      END,
      customer_email,
      customer_name,
      'Job Status Update: ' || COALESCE(NEW.title, 'Untitled Job'),
      NOW(),
      jsonb_build_object(
        'jobId', NEW.id::text,
        'jobTitle', job_title,
        'status', NEW.status,
        'previousStatus', previous_status
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simplified notify_payment_received function (no HTTP calls)
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
    
    -- Instead of making an HTTP call, we'll just log that a notification should be sent
    -- The actual notification will be sent by the application layer
    INSERT INTO email_notifications (
      type, 
      recipient_email, 
      recipient_name, 
      subject, 
      sent_at,
      metadata
    ) VALUES (
      'payment_received',
      customer_email,
      customer_name,
      'Payment Received',
      NOW(),
      jsonb_build_object(
        'paymentAmount', NEW.amount,
        'paymentDate', NEW.created_at::date
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the README to explain the fallback approach
/*
 * Fallback Notification Approach
 * 
 * If the HTTP extension is not available in your Supabase plan, this migration
 * provides a fallback approach that uses application-level notifications.
 * 
 * Instead of making HTTP calls directly from the database, the functions now
 * simply log notification events in the email_notifications table.
 * 
 * Your application should periodically check this table for new notifications
 * and send them using your preferred notification service (e.g., Resend, Twilio).
 * 
 * Example query to find pending notifications:
 * 
 * SELECT * FROM email_notifications 
 * WHERE sent_at > created_at OR sent_at IS NULL
 * ORDER BY created_at DESC;
 * 
 * After sending a notification, update the record:
 * 
 * UPDATE email_notifications 
 * SET sent_at = NOW(), status = 'sent'
 * WHERE id = 'notification-id';
 */