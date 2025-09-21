# Database Connection Tests

This document explains how to use the database connection test scripts and configure your environment variables.

## Environment Variables Setup

1. Open the `.env.local` file in your project root
2. Replace the placeholder values with your actual Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`: Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   - `SUPABASE_DB_PASSWORD`: Your PostgreSQL database password

## Getting Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to "Project Settings" > "API"
3. Copy the following values:
   - Project URL (for `NEXT_PUBLIC_SUPABASE_URL`)
   - Project API keys:
     - `anon` key (for `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`)
     - `service_role` key (for `SUPABASE_SERVICE_ROLE_KEY`)

4. For the database password:
   - Go to "Project Settings" > "Database"
   - Find your database password under "Connection Info"

## Running the Tests

### Test Direct PostgreSQL Connection

```bash
node test-direct-postgres.mjs
```

### Run Comprehensive Database Tests

```bash
node comprehensive-db-test.mjs
```

## What These Scripts Test

1. **Supabase Client with Anon Key**: Tests basic authenticated user access
2. **Supabase Client with Service Role Key**: Tests admin-level access
3. **Direct PostgreSQL Connection**: Tests direct database access bypassing Supabase client

## Troubleshooting

### Connection Issues

If you're getting connection errors:

1. Verify all environment variables are correctly set
2. Check your internet connection
3. Ensure your Supabase project is not paused
4. Verify your IP is allowed in Supabase's database settings

### Authentication Issues

If you're getting permission denied errors:

1. Check that your RLS policies are correctly applied
2. Verify table ownership
3. Confirm your service role key has the necessary permissions

### DNS Resolution Issues

If you're getting DNS errors with the direct PostgreSQL connection:

1. Try using a VPN if you're in a restricted network
2. Check if your firewall is blocking the connection
3. Verify the connection details are correct