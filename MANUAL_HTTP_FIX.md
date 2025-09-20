# Manual Fix for HTTP Extension Issue

Since you're still encountering the error "function extensions.http_post does not exist", you need to manually enable the HTTP extension in your Supabase database.

## Steps to Fix

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/pnoxqzlxfuvjvufdjuqh
2. Navigate to the SQL Editor
3. Run the following SQL commands one by one:

### Step 1: Create Extensions Schema and Enable HTTP Extension

```sql
-- Create the extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Enable the http extension
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
```

If you get an error saying the extension is not available, you may need to contact Supabase support to enable it for your project, as some plans may not have the HTTP extension enabled by default.

### Step 2: Grant Permissions

```sql
-- Grant usage on the extensions schema
GRANT USAGE ON SCHEMA extensions TO authenticator;
GRANT USAGE ON SCHEMA extensions TO service_role;

-- Grant execute permission on the http_post function
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO authenticator;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO service_role;
```

### Step 3: Test the HTTP Extension

After enabling the extension, test if it's working by running:

```sql
SELECT extensions.http_post('https://httpbin.org/post', '{}', '{}');
```

If this returns a response without errors, the HTTP extension is properly enabled.

### Step 4: Update Your Functions (if needed)

If you still encounter issues, you may need to recreate the notification functions. Run this to update the `notify_job_status_change` function:

```sql
CREATE OR REPLACE FUNCTION notify_job_status_change()
RETURNS TRIGGER AS $$
DECLARE
  customer_email TEXT;
  customer_name TEXT;
  job_title TEXT;
  previous_status TEXT;
BEGIN
  -- Get customer email and name
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
```

## Alternative Solution

If the HTTP extension is not available in your Supabase plan, you can modify your approach to use the Supabase client instead of direct HTTP calls from the database. This would involve:

1. Removing the database triggers that call `extensions.http_post`
2. Updating your application code to send notifications after successful database updates

For example, in your job status update logic, after successfully updating the job status, you would call your notification service directly from the application layer rather than relying on database triggers.

## Need Help?

If you continue to have issues:
1. Check that your Supabase project has the HTTP extension enabled (this may require a paid plan)
2. Contact Supabase support for assistance with enabling the extension
3. Consider using application-level notifications instead of database triggers