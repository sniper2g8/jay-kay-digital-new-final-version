# Email Notification System Documentation

## Overview

The JayKay Digital Press application uses a comprehensive email notification system built on Supabase Edge Functions and Resend for email delivery. The system automatically sends notifications for various events in the application lifecycle.

## Architecture

### Components

1. **Supabase Edge Function** (`supabase/functions/email-notifications/index.ts`)
   - Handles all email sending logic
   - Uses Resend API for email delivery
   - Logs all sent emails to the database

2. **Database Tables**
   - `email_notifications` - Stores logs of all sent emails
   - `email_templates` - Stores customizable email templates

3. **Database Triggers**
   - Automatic notifications on job status changes
   - Payment received notifications
   - Invoice sent notifications

## Email Types

The system supports several types of notifications:

1. `job_created` - Sent when a new job is submitted
2. `job_status_change` - Sent when a job status is updated
3. `payment_received` - Sent when a payment is confirmed
4. `statement_ready` - Sent when a monthly statement is generated
5. `invoice_sent` - Sent when an invoice is issued
6. `custom_email` - Custom messages sent by admins

## Setup Instructions

### Environment Variables

The following environment variables must be configured in your Supabase project:

```
RESEND_API_KEY=your_resend_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Deployment

1. Deploy the Edge Function:

   ```bash
   supabase functions deploy email-notifications
   ```

2. Ensure the database migrations are applied:
   ```bash
   supabase db push
   ```

## Database Schema

### email_notifications Table

```sql
CREATE TABLE email_notifications (
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
```

### email_templates Table

```sql
CREATE TABLE email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'custom',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Usage

To send a custom email, make a POST request to the Edge Function:

```javascript
const response = await fetch(
  "https://your-project.supabase.co/functions/v1/email-notifications",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer YOUR_SERVICE_ROLE_KEY",
    },
    body: JSON.stringify({
      type: "custom_email",
      recipientEmail: "customer@example.com",
      recipientName: "John Doe",
      data: {
        customSubject: "Special Offer",
        customMessage: "We have a special offer for you!",
      },
    }),
  },
);
```

## Customization

### Email Templates

All email templates can be customized by modifying the HTML generation functions in the Edge Function. Each email type has its own template function:

- `generateJobCreatedTemplate()`
- `generateJobStatusTemplate()`
- `generatePaymentReceivedTemplate()`
- `generateStatementReadyTemplate()`
- `generateInvoiceTemplate()`
- `generateCustomEmailTemplate()`

### Adding New Email Types

1. Add the new type to the `EmailNotificationRequest` interface
2. Add a case in the `generateEmailContent()` function
3. Create a new template generation function
4. Update the database triggers if needed

## Troubleshooting

### Common Issues

1. **Emails not sending**: Check that `RESEND_API_KEY` is properly configured
2. **Database logging fails**: Verify the `email_notifications` table exists
3. **Triggers not firing**: Ensure the trigger functions are properly installed

### Logs

All email sending attempts are logged in the `email_notifications` table with success/failure status and error messages for failed attempts.

## Security

- Only service role can send emails to prevent abuse
- RLS policies ensure users can only see their own email notifications
- All communications use HTTPS
