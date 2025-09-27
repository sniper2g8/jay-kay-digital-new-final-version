# Invoice Loading Fix - Step by Step Guide

## Issue: Invoices not loading on production but working on local

### Step 1: Verify Environment Variables

**On your production server, run:**

```bash
# For Linux/Mac
./production-env-check.sh

# For Windows
powershell -ExecutionPolicy Bypass -File production-env-check.ps1
```

**Manual check - Ensure these variables are set:**

```bash
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
echo $SUPABASE_SERVICE_ROLE_KEY
```

### Step 2: Test API Endpoints

**Test the debug endpoints on your production server:**

```bash
# Test basic connectivity
curl https://your-domain.com/api/debug-invoice

# Test invoice data
curl https://your-domain.com/api/test-invoice-data
```

Expected response from `/api/debug-invoice`:

```json
{
  "success": true,
  "message": "API connectivity test successful",
  "environment": {
    "SUPABASE_URL": true,
    "SUPABASE_PUBLISHABLE_DEFAULT_KEY": true,
    "SUPABASE_SERVICE_ROLE_KEY": true
  }
}
```

### Step 3: Check Server Logs

**Look for these specific error patterns in your server logs:**

1. **Environment Variable Errors:**

   ```
   Missing Supabase environment variables
   Server configuration error
   ```

2. **Database Connection Errors:**

   ```
   Database error
   Supabase credentials mismatch
   ```

3. **Authentication Errors:**
   ```
   401 Unauthorized
   Session error
   ```

### Step 4: Test Specific Invoice ID

**Find a valid invoice ID:**

```bash
curl https://your-domain.com/api/test-invoice-data
```

**Then test the invoice items endpoint:**

```bash
curl https://your-domain.com/api/invoice-items/[INVOICE_ID_FROM_ABOVE]
```

### Step 5: Browser Console Debugging

**Open browser console on the invoice page and look for:**

1. **Network errors:**
   - Failed requests to `/api/invoice-items/[id]`
   - Status codes: 500, 401, 404

2. **JavaScript errors:**
   - Environment variable undefined
   - Supabase client creation failures

3. **API response errors:**
   - Check the actual response content

### Step 6: Fallback Mechanism

The updated invoice page now includes a fallback mechanism that:

1. First tries the API route
2. If that fails, tries direct database query
3. Shows detailed error information

### Common Production Issues and Fixes

#### Issue 1: Environment Variables Not Loading

**Symptoms:** "Server configuration error"
**Fix:**

- Ensure `.env.production` file exists
- Restart your application server
- Check file permissions

#### Issue 2: Wrong Environment Variable Names

**Symptoms:** API routes fail with authentication errors
**Fix:**

- Verify all API routes use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- Not `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

#### Issue 3: Database Permissions

**Symptoms:** "Database error" or RLS policy errors
**Fix:**

- Check Supabase Row Level Security (RLS) policies
- Verify service role key has proper permissions
- Test with a Supabase admin user

#### Issue 4: CORS or Network Issues

**Symptoms:** Network request failures
**Fix:**

- Check if your production domain is allowed in Supabase
- Verify SSL certificates
- Check firewall settings

### Updated Files with Fixes

1. **Enhanced Error Handling:** `src/app/dashboard/invoices/[id]/page.tsx`
   - Added fallback database query
   - Detailed error logging
   - Environment variable checking

2. **Debug Endpoints:**
   - `/api/debug-invoice` - Tests connectivity
   - `/api/test-invoice-data` - Gets sample data

3. **Environment Checks:**
   - `production-env-check.sh` (Linux/Mac)
   - `production-env-check.ps1` (Windows)

### Production Deployment Checklist

- [ ] Environment variables properly set
- [ ] `.env.production` file uploaded
- [ ] Server restarted after env changes
- [ ] Debug endpoints returning success
- [ ] Browser console shows no errors
- [ ] Server logs show no errors
- [ ] Specific invoice ID loads correctly

### If Issue Persists

1. **Check Supabase Dashboard:**
   - Verify project is active
   - Check API usage and limits
   - Review authentication logs

2. **Database Direct Test:**
   - Connect directly to Supabase
   - Run: `SELECT * FROM invoice_items LIMIT 1;`
   - Verify table exists and has data

3. **Network Diagnostics:**
   - Test from different browsers
   - Check mobile vs desktop
   - Test from different networks

4. **Contact Support:**
   - Provide server logs
   - Share browser console errors
   - Include network request details

### Emergency Workaround

If the issue persists, you can temporarily use the direct database query method:

1. Update the invoice page to skip the API and query directly
2. This bypasses server-side issues but requires client-side authentication
3. Use only as a temporary measure while debugging

### Next Steps

1. Run the environment check script
2. Test the debug endpoints
3. Check server and browser logs
4. Report specific error messages found

The enhanced error handling and fallback mechanisms should provide much more detailed information about what's failing in production.
