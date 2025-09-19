# Email Notifications Edge Function

This Supabase Edge Function handles all email notifications for the JayKay Digital Press application.

## Important Note

The TypeScript errors you see in this file are expected because:

1. This is a Deno function, not a Node.js function
2. The imports use URLs rather than npm packages
3. The `Deno` global object is only available in the Deno runtime

These errors will NOT prevent the function from working when deployed to Supabase.

## Function Overview

This function handles the following email notification types:

- Job submitted
- Job status update
- Invoice sent
- Payment received
- Direct messages

## Environment Variables Required

- `RESEND_API_KEY` - Your Resend API key for sending emails
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database access

## Deployment

To deploy this function to Supabase:

```bash
supabase functions deploy email-notifications
```

## Usage

The function is triggered automatically by database triggers when:

- A new job is created
- A job status is updated
- A payment is received
- An invoice is sent

It can also be called manually via HTTP POST requests for direct messages.
