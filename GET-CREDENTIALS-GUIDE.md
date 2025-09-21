# How to Get Your Supabase Credentials

This guide will help you get the actual credentials needed to update your `.env.local` file.

## Step 1: Get Supabase API Keys

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project (`pnoxqzlxfuvjvufdjuqh`)
3. In the left sidebar, click on **Project Settings** (gear icon)
4. Click on **API**

You'll see several keys here:

### Project URL
```
https://pnoxqzlxfuvjvufdjuqh.supabase.co
```
(This should already be correct in your `.env.local`)

### API Keys
- **anon key** (public): This is your `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- **service_role key** (secret): This is your `SUPABASE_SERVICE_ROLE_KEY`

## Step 2: Get Database Password

1. In the same project, click on **Project Settings** (gear icon)
2. Click on **Database**
3. Scroll down to **Connection Info**
4. Find your **Password** - this is your `SUPABASE_DB_PASSWORD`

## Step 3: Update Your .env.local File

Open your `.env.local` file and replace these placeholder values:

```env
# Before (placeholders):
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_DB_PASSWORD=your-postgres-password-here

# After (actual values):
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (your actual anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (your actual service role key)
SUPABASE_DB_PASSWORD=your-actual-database-password
```

## Step 4: Verify Your Changes

After updating your credentials, run:

```bash
node test-credentials.mjs
```

All values should show as ✅ Set instead of ❌ Missing/Placeholder.

## Troubleshooting

### If You Still See Authentication Errors

1. Double-check that you copied the complete keys (they should be long strings starting with `ey`)
2. Make sure there are no extra spaces before or after the values
3. Ensure you're using the correct service_role key, not the anon key, for server-side operations

### If You Can't Find Your Credentials

1. Make sure you're looking at the correct project (`pnoxqzlxfuvjvufdjuqh`)
2. Check that you have the necessary permissions to view project settings
3. If you're unsure, contact your project administrator

## Security Notes

- Never commit your actual credentials to version control
- The `.gitignore` file should already exclude `.env*` files
- Keep your credentials secure and rotate them periodically
- The service role key has full database access, so protect it carefully