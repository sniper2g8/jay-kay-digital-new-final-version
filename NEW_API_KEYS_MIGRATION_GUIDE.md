# New Supabase API Keys Migration Guide

This guide explains how to migrate from the old JWT-based API keys to the new Supabase API keys format.

## Overview of New API Keys

Supabase has introduced a new API key format with better security:

1. **Publishable Keys** (`sb_publishable_...`)
   - Safe for public use (web pages, mobile apps)
   - Replaces the old `anon` JWT key
   - Cannot access sensitive data without proper RLS

2. **Secret Keys** (`sb_secret_...`)
   - For backend use only (servers, Edge Functions)
   - Replaces the old `service_role` JWT key
   - Has elevated privileges, bypasses RLS when used properly

## Migration Steps

### 1. Update Environment Variables

**Old Variables:**
```env
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**New Variables:**
```env
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_actual_key_here
SUPABASE_SECRET_KEY=sb_secret_your_actual_key_here
```

### 2. Get Your New Keys

1. Go to your Supabase Dashboard
2. Navigate to **Project Settings** > **API**
3. In the **API Keys** section, copy:
   - Your `sb_publishable_...` key
   - Your `sb_secret_...` key

### 3. Update Your Code

**Before:**
```javascript
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
```

**After:**
```javascript
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);
```

### 4. Update .env.local File

Replace the placeholder values in your `.env.local` file with your actual keys:

```env
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_actual_key_here
SUPABASE_SECRET_KEY=sb_secret_your_actual_key_here
SUPABASE_DB_PASSWORD=your_actual_database_password
```

## Benefits of New API Keys

1. **Better Security Model**: Clear distinction between public and secret keys
2. **Improved Key Management**: Easier to rotate and manage keys
3. **Enhanced Protection**: Better protection against misuse
4. **Future-Proof**: New format that Supabase will continue to support

## Important Security Notes

1. **Never expose secret keys** in client-side code
2. **Publishable keys are safe** for public use
3. **Use secret keys only in backend components**
4. **Regularly rotate keys** for better security

## Testing Your Migration

After updating your keys:

1. Run `node test-new-api-keys.mjs` to verify the connection
2. Test your application functionality
3. Ensure the "Error fetching statement periods: {}" is resolved
4. Verify all database operations work correctly

## Rollback Plan

If you encounter issues:

1. Restore your `.env.local` backup
2. Revert code changes
3. Use the old JWT-based keys temporarily
4. Contact Supabase support if needed

## Next Steps

1. Get your actual `sb_publishable_...` and `sb_secret_...` keys
2. Update your `.env.local` file
3. Run the automated migration scripts:
   - Windows: `migrate-to-new-api-keys.bat`
   - Mac/Linux: `migrate-to-new-api-keys.sh`
4. Test your application thoroughly
5. Remove backup files after confirming everything works