# JayKay Digital Press Email Notification System - Summary

## Overview

This document provides a comprehensive summary of the email notification system for the JayKay Digital Press application, based on the code and database schema provided.

## System Components

### 1. Supabase Edge Function

- **Location**: `supabase/functions/email-notifications/index.ts`
- **Purpose**: Handles all email sending through Resend API
- **Runtime**: Deno (TypeScript)
- **Trigger Methods**:
  - Database triggers (automatic)
  - HTTP POST requests (manual)

### 2. Database Schema

The system uses three main tables:

#### Users Table

```sql
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Jobs Table

```sql
CREATE TABLE IF NOT EXISTS jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    customer_id UUID REFERENCES users(id),
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2),
    invoice_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Email Notifications Log Table

```sql
CREATE TABLE IF NOT EXISTS email_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    job_id UUID REFERENCES jobs(id),
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Email Notification Types

1. **Job Submitted** (`job_submitted`)
   - Triggered when a new job is created
   - Sends notification to all admins
   - Sends confirmation to customer

2. **Job Status Update** (`job_status_update`)
   - Triggered when job status changes
   - Sends update to customer

3. **Invoice Sent** (`invoice_sent`)
   - Triggered when invoice is generated
   - Sends invoice link to customer

4. **Payment Received** (`payment_received`)
   - Triggered when payment is confirmed
   - Sends receipt to customer
   - Sends notification to all admins

5. **Direct Message** (`direct_message`)
   - Manually triggered
   - Sends custom messages to specific recipients

## Implementation Details

### Authentication

- Uses Supabase Service Role Key for database access
- No user authentication required for internal functions

### Email Delivery

- Uses Resend API for email delivery
- All emails are HTML formatted with responsive design
- Each email type has a custom template

### Error Handling

- Comprehensive error handling with detailed logging
- Failed emails are logged with error messages
- All email attempts are logged in the database

### Security

- Row Level Security (RLS) policies implemented
- Users can only see their own data
- Admins can see all data
- Service role can manage all records

## Setup Requirements

### Environment Variables

```bash
RESEND_API_KEY=your_resend_api_key
SUPABASE_URL=your_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Deployment

1. Deploy the Edge Function:

   ```bash
   supabase functions deploy email-notifications
   ```

2. Apply database migrations:
   ```bash
   supabase db push
   ```

## Database Triggers

The system includes automatic triggers for:

- Job creation notifications
- Job status updates
- Payment confirmations

These triggers automatically call the Edge Function when relevant database changes occur.

## Customization

### Email Templates

All email templates can be customized by modifying the HTML generation functions:

- `generateJobNotificationTemplate()`
- `generateJobReceivedTemplate()`
- `generateJobStatusUpdateTemplate()`
- `generateInvoiceTemplate()`
- `generatePaymentReceivedTemplate()`
- `generatePaymentReceivedAdminTemplate()`
- `generateDirectMessageTemplate()`

### Adding New Notification Types

1. Add the new type to the `EmailPayload` interface
2. Add a new case in the switch statement
3. Create a new template generation function
4. Update database triggers if needed

## Monitoring and Logging

All email activities are logged in the `email_notifications` table with:

- Email type
- Recipient information
- Subject line
- Send status (sent/failed/pending)
- Error messages for failed emails
- Timestamps

This allows for complete audit trails and troubleshooting capabilities.

## Best Practices Implemented

1. **Responsive Design**: All emails are mobile-friendly
2. **Professional Branding**: Consistent styling and branding
3. **Clear Information Architecture**: Well-structured content
4. **Actionable Content**: Clear next steps for recipients
5. **Error Recovery**: Comprehensive logging for troubleshooting
6. **Security**: Proper authentication and authorization
7. **Scalability**: Designed to handle high email volumes
