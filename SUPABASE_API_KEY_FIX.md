# Supabase API Key Verification and Update Guide

## Issue: "Invalid API key" Error in Production

The error indicates that your production Supabase API keys are either expired, invalid, or pointing to the wrong project.

### Step 1: Get Your Current Supabase API Keys

**Go to your Supabase Dashboard:**
1. Visit: https://app.supabase.com/
2. Select your project: `pnoxqzlxfuvjvufdjuqh`
3. Go to **Settings** → **API**

### Step 2: Get the Correct API Keys

You need these specific keys:

#### **Anon/Public Key (for NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY):**
- In the **Project API keys** section
- Copy the **`anon` / `public` key**
- It should start with: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### **Service Role Key (for SUPABASE_SERVICE_ROLE_KEY):**
- In the **Project API keys** section  
- Copy the **`service_role` key**
- It should start with: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- ⚠️ **WARNING**: This is a secret key - never expose it publicly!

### Step 3: Update Your Production Environment

**Update these environment variables in your production server:**

```env
# Replace with your actual keys from Supabase dashboard
NEXT_PUBLIC_SUPABASE_URL=https://pnoxqzlxfuvjvufdjuqh.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJhbGci... # Your actual anon/public key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... # Your actual service role key
```

### Step 4: How to Update Environment Variables

**Method 1: If using a hosting platform (Vercel, Netlify, etc.):**
1. Go to your project settings
2. Find "Environment Variables" section
3. Update the three variables above
4. Redeploy your application

**Method 2: If using a VPS/dedicated server:**
1. SSH into your server
2. Update your `.env` or `.env.production` file
3. Restart your application

**Method 3: If using Docker:**
1. Update your environment variables in docker-compose.yml or Dockerfile
2. Rebuild and restart your containers

### Step 5: Verify the Fix

**After updating the environment variables:**

1. **Test the debug endpoint:**
   ```
   https://www.jaykaydigitalpress.com/api/test-invoice-items/ee28e4c2-393d-43ba-a3fa-6916459ec393
   ```

2. **Expected successful response:**
   ```json
   {
     "success": true,
     "invoice": { ... },
     "items_count": 5,
     "items": [...],
     "env_status": {
       "SUPABASE_URL": true,
       "SUPABASE_PUBLISHABLE_KEY": true,
       "SUPABASE_SERVICE_ROLE_KEY": true
     }
   }
   ```

3. **Test the original invoice page:**
   ```
   https://www.jaykaydigitalpress.com/dashboard/invoices/ee28e4c2-393d-43ba-a3fa-6916459ec393
   ```

### Common Issues and Solutions

#### Issue 1: Keys are from different Supabase project
**Solution**: Make sure you're copying keys from the `pnoxqzlxfuvjvufdjuqh` project

#### Issue 2: Keys are expired
**Solution**: Generate new keys in the Supabase dashboard

#### Issue 3: Environment variables not loading
**Solution**: 
- Check file permissions
- Restart your application/server
- Verify environment variable names are exact matches

#### Issue 4: Still getting 404 errors
**Solution**: The database might not have the specific invoice ID. Try with a different invoice ID from the test endpoint

### Verification Checklist

- [ ] Copied **anon/public key** from correct Supabase project
- [ ] Copied **service role key** from correct Supabase project  
- [ ] Updated environment variables in production
- [ ] Restarted/redeployed application
- [ ] Tested debug endpoint returns success
- [ ] Tested actual invoice page loads correctly

### Quick Test Commands

```bash
# Test 1: Check if environment variables are set
curl "https://www.jaykaydigitalpress.com/api/debug-invoice"

# Test 2: Test specific invoice that was failing
curl "https://www.jaykaydigitalpress.com/api/test-invoice-items/ee28e4c2-393d-43ba-a3fa-6916459ec393"

# Test 3: Test actual invoice items API
curl "https://www.jaykaydigitalpress.com/api/invoice-items/ee28e4c2-393d-43ba-a3fa-6916459ec393"
```

### Security Notes

⚠️ **Important**: 
- Never commit the `service_role` key to version control
- Keep the `service_role` key secret - it has full database access
- Only use the `anon/public` key in client-side code
- Regularly rotate your API keys for security

### If You Still Have Issues

1. **Double-check the project URL**: Make sure it's `pnoxqzlxfuvjvufdjuqh.supabase.co`
2. **Check Supabase project status**: Ensure your project is active and not paused
3. **Verify database access**: Test connection directly in Supabase dashboard
4. **Check for typos**: API keys are case-sensitive and must be exact

---

**Next Steps**: After getting the correct API keys from your Supabase dashboard, update your production environment variables and test the endpoints above.