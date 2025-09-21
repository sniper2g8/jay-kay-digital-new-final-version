# Getting Your Supabase Credentials

This guide explains how to obtain the necessary credentials to configure your `.env.local` file correctly.

## Step 1: Access Your Supabase Project Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Sign in with your account
3. Select your project (`pnoxqzlxfuvjvufdjuqh`)

## Step 2: Get API Keys

1. In the left sidebar, click on **Project Settings** (gear icon)
2. Click on **API**
3. Copy the following values:

### Project URL
- Copy the **Project URL** at the top
- This should be: `https://pnoxqzlxfuvjvufdjuqh.supabase.co`

### API Keys
- **anon** key: This is your `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- **service_role** key: This is your `SUPABASE_SERVICE_ROLE_KEY`

## Step 3: Get Database Password

1. In the left sidebar, click on **Project Settings** (gear icon)
2. Click on **Database**
3. Under **Connection Info**, find your **Password**
4. This is your `SUPABASE_DB_PASSWORD`

## Step 4: Update Your .env.local File

Replace the placeholder values in your `.env.local` file with the actual values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://pnoxqzlxfuvjvufdjuqh.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-actual-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here

# Direct PostgreSQL Database Connection
SUPABASE_DB_PASSWORD=your-actual-postgres-password-here
```

## Step 5: Verify Your Credentials

After updating the credentials, test the connection:

```bash
node test-service-role.mjs
```

You should see:
```
✅ Service role test passed
```

## Troubleshooting

### Invalid API Key Error
If you see "Invalid API key":
1. Double-check that you copied the correct keys from the Supabase dashboard
2. Ensure there are no extra spaces or characters
3. Make sure you're using the **service_role** key for server-side operations

### Permission Denied Errors
If you still see "permission denied for table":
1. Run the `complete-permission-fix.sql` script in your Supabase SQL Editor
2. Wait a few minutes for the changes to propagate
3. Test again

### Connection Issues
If you have connection issues:
1. Verify your internet connection
2. Check that your Supabase project is not paused
3. Ensure your IP address is allowed in the Supabase database settings

## Security Notes

- Never commit your `.env.local` file to version control
- The `.gitignore` file should already exclude `.env*` files
- Keep your credentials secure and rotate them periodically
- The service role key has full access to your database, so protect it carefully

## Need Help?

If you're still having issues:
1. Check the Supabase documentation: https://supabase.com/docs
2. Visit the Supabase support forums: https://github.com/supabase/supabase/discussions
3. Contact Supabase support through your dashboard