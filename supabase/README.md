# Supabase Configuration for Email Notifications

## Setup Instructions

### 1. Deploy Edge Function

First, make sure you have the Supabase CLI installed and logged in:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF
```

Deploy the email notifications Edge Function:

```bash
# Deploy the function
supabase functions deploy email-notifications

# Set required secrets
supabase secrets set RESEND_API_KEY=re_2r26Ro81_8bUokw3XUmpNydgAGR4nvFMJ
```

### 2. Run Database Migrations

Execute the database migrations to create required tables and triggers:

```bash
# Run the email notifications migration
supabase db push

# Or run specific migrations
psql -h YOUR_DB_HOST -U postgres -d postgres -f supabase/migrations/20241231_email_notifications.sql
psql -h YOUR_DB_HOST -U postgres -d postgres -f supabase/migrations/20241231_email_templates.sql
```

### 3. Environment Variables

Make sure these environment variables are set in your Supabase project:

#### Required Secrets (set via Supabase CLI or Dashboard)
- `RESEND_API_KEY`: Your Resend API key for sending emails

#### Project Settings
Update the database function URLs in the migration file:
- Replace `https://your-project.supabase.co` with your actual Supabase project URL
- Update the `service_role_key` configuration

### 4. Update Database Triggers

The migration includes triggers for:
- Job status changes (automatically sends notifications)
- Payment received notifications
- Invoice sent notifications

Make sure to update the function URLs in the triggers to match your project:

```sql
-- Update this URL in the migration file
url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/email-notifications'
```

### 5. Enable HTTP Extension

Make sure the `http` extension is enabled for database triggers:

```sql
-- Enable the http extension for making HTTP requests from triggers
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
```

### 6. Configure Row Level Security

The migrations include RLS policies, but ensure your project has the correct policies:

- Service role can manage all email notifications
- Authenticated users can view their own email notifications
- Admins can manage email templates

### 7. Test the System

1. Test the Edge Function directly:
```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/email-notifications' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "custom_email",
    "recipientEmail": "test@example.com",
    "recipientName": "Test User",
    "data": {
      "customSubject": "Test Email",
      "customMessage": "This is a test message."
    }
  }'
```

2. Test database triggers by updating job status
3. Test admin email interface at `/admin/email`

## Troubleshooting

### Common Issues

1. **Function deployment fails**
   - Check Supabase CLI is latest version
   - Verify project is linked correctly
   - Check function syntax

2. **Database triggers not firing**
   - Ensure http extension is enabled
   - Check trigger function URLs are correct
   - Verify service role key is set

3. **RLS blocking requests**
   - Check policies are correctly configured
   - Verify user roles and permissions
   - Test with service role key

4. **Emails not sending**
   - Verify Resend API key is correct and active
   - Check function logs in Supabase dashboard
   - Verify email addresses are valid

### Logs and Monitoring

- View function logs in Supabase Dashboard > Functions
- Monitor email_notifications table for sent emails
- Check database logs for trigger execution
- Use Resend dashboard to track email delivery

## Production Considerations

1. **Rate Limiting**: Consider implementing rate limiting for bulk emails
2. **Email Quotas**: Monitor Resend usage and quotas
3. **Error Handling**: Implement retry logic for failed emails
4. **Performance**: Consider background job processing for large email batches
5. **Security**: Regularly rotate API keys and review access policies

## Features Included

### Automatic Notifications
- ✅ Job created notifications
- ✅ Job status change notifications
- ✅ Payment received notifications
- ✅ Invoice sent notifications

### Admin Email System
- ✅ Custom email composition
- ✅ Bulk email to multiple customers
- ✅ Email template management
- ✅ Customer selection interface
- ✅ Email preview functionality

### Professional Templates
- ✅ Responsive HTML email designs
- ✅ JayKay Digital Press branding
- ✅ Status-specific content and styling
- ✅ Professional formatting and layout