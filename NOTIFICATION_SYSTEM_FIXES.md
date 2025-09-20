# Notification System Fixes

This document explains the issues with your notification system and the fixes that have been implemented.

## Issues Identified

1. **Schema Error**: "schema 'net' does not exist" - Functions were calling `net.http_post()` but the correct schema is `extensions`
2. **Function Error**: "function extensions.http_post does not exist" - HTTP extension was not enabled in the database
3. **Duplicate Policies**: "policy already exists" - Migration files were trying to create policies that already existed
4. **Duplicate Indexes**: Indexes were being created without checking if they already existed

## Fixes Implemented

### 1. Schema Reference Fix
Updated all function calls from `net.http_post()` to `extensions.http_post()` in:
- `supabase/migrations/20241231_email_notifications.sql`
- `supabase/migrations/20250101_update_email_notifications.sql`

### 2. Duplicate Policy Fix
Added `DROP POLICY IF EXISTS` statements before creating policies in:
- `supabase/migrations/20241231_email_notifications.sql`
- `supabase/migrations/20250101_update_email_notifications.sql`
- `supabase/migrations/20241232_email_templates.sql`

### 3. Duplicate Index Fix
Added `DROP INDEX IF EXISTS` statements before creating indexes in:
- `supabase/migrations/20241231_email_notifications.sql`
- `supabase/migrations/20250101_update_email_notifications.sql`

### 4. HTTP Extension Enablement
Created new migration `20250104_enable_http_extension_properly.sql` that:
- Creates the `extensions` schema if it doesn't exist
- Enables the HTTP extension
- Grants proper permissions
- Updates notification functions

### 5. Fallback Solution
Created migration `20250105_fallback_to_app_notifications.sql` that:
- Removes HTTP calls from database functions
- Logs notification events in the `email_notifications` table
- Allows application-level notification handling

## How to Apply the Fixes

### Option 1: Try to Enable HTTP Extension (Recommended if available)
1. Run the migrations in order:
   ```bash
   npx supabase db push
   ```

2. If you encounter issues with the HTTP extension, check if it's available:
   ```bash
   node check-http-extension.mjs
   ```

### Option 2: Use Application-Level Notifications (If HTTP extension is not available)
1. Apply the fallback migration:
   ```sql
   -- Run the content of 20250105_fallback_to_app_notifications.sql in your Supabase SQL Editor
   ```

2. Modify your application code to check for pending notifications and send them:
   ```javascript
   // Example: Check for pending notifications periodically
   const { data: pendingNotifications, error } = await supabase
     .from('email_notifications')
     .select('*')
     .or('sent_at.is.null,sent_at.gt.created_at');
   
   // Send notifications using your preferred service (Resend, etc.)
   // Then update the notification records
   ```

## Testing the Fixes

1. **Check HTTP Extension Availability**:
   ```bash
   node check-http-extension.mjs
   ```

2. **Test Job Status Update**:
   - Try updating a job status through your application
   - Check if the operation completes without errors

3. **Verify Notification Logging**:
   ```sql
   SELECT * FROM email_notifications ORDER BY created_at DESC LIMIT 5;
   ```

## Troubleshooting

### If HTTP Extension is Not Available
1. Use the fallback approach with application-level notifications
2. Consider upgrading your Supabase plan to one that includes the HTTP extension
3. Contact Supabase support for assistance

### If You Still Get Policy Errors
1. Manually drop existing policies in Supabase SQL Editor:
   ```sql
   DROP POLICY IF EXISTS "Service role can manage email notifications" ON email_notifications;
   DROP POLICY IF EXISTS "Users can view their own email notifications" ON email_notifications;
   ```

### If You Still Get Index Errors
1. Manually drop existing indexes:
   ```sql
   DROP INDEX IF EXISTS idx_email_notifications_recipient;
   DROP INDEX IF EXISTS idx_email_notifications_type;
   DROP INDEX IF EXISTS idx_email_notifications_sent_at;
   ```

## Alternative Implementation

If you prefer to handle notifications entirely at the application level:

1. Remove the database triggers:
   ```sql
   DROP TRIGGER IF EXISTS trigger_job_status_notification ON jobs;
   DROP FUNCTION IF EXISTS notify_job_status_change();
   ```

2. Update job status in your application code:
   ```javascript
   // After updating job status
   const { error } = await supabase
     .from('jobs')
     .update({ status: newStatus })
     .eq('id', jobId);
   
   if (!error) {
     // Send notification from application
     await sendJobStatusNotification(jobId, newStatus);
   }
   ```

This approach eliminates the dependency on database-level HTTP calls and gives you more control over the notification process.