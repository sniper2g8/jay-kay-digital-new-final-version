# Update Your Supabase Credentials

You need to update your `.env.local` file with actual Supabase credentials. Here's exactly what to do:

## 1. Get Your Actual Keys from Supabase Dashboard

1. Go to: https://app.supabase.com/
2. Select your project: `pnoxqzlxfuvjvufdjuqh`
3. In the left sidebar, click **Project Settings** (gear icon)
4. Click **API**

## 2. Copy the Actual Keys

Look for the **Project API keys** section and copy:

- **anon key** → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

## 3. Get Your Database Password

1. In the same project, click **Project Settings** (gear icon)
2. Click **Database**
3. Scroll down to **Connection Info**
4. Copy your **Password** → `SUPABASE_DB_PASSWORD`

## 4. Update Your .env.local File

Replace the placeholder comments with your actual keys:

```env
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBub3hxeXpseGZ1dmp1dmZkanVxaCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzI2NTQ3MjM0LCJleHAiOjE3NTgxODMyMzR9.YourActualKeyHere
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBub3hxeXpseGZ1dmp1dmZkanVxaCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MjY1NDcyMzQsImV4cCI6MTc1ODE4MzIzNH0.YourActualKeyHere
SUPABASE_DB_PASSWORD=YourActualDatabasePasswordHere
```

## 5. Verify Your Keys

After updating, run:

```bash
node verify-supabase-connection.mjs
```

## What Your Keys Should Look Like

✅ **Correct Format:**

- Anon Key: Starts with `eyJ` and is 100+ characters long
- Service Role Key: Starts with `eyJ` and is 100+ characters long
- Database Password: Complex password with letters, numbers, and special characters

❌ **Incorrect (Placeholders):**

- `sb_publishable_...`
- `sb_secret_...`
- Generic passwords like `...()Admin@1`

## After Updating

1. Save your `.env.local` file
2. Restart your development server
3. Test the connection with the verification script
