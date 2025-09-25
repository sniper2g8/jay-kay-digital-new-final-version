# Production Troubleshooting Guide

## Invoice Loading Issues in Production

### Issue Description
**Problem**: Invoices not loading on production but working correctly on local development.
**Symptoms**: 
- Invoice details page shows loading state indefinitely
- API calls to `/api/invoice-items/[id]` return server configuration errors
- Browser console shows environment variable errors

### Root Cause
Environment variable inconsistency between client-side and server-side code:

1. **Client-side code** (React components) uses: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
2. **Server-side code** (API routes) was using: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 
3. **Environment files** only defined: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

This resulted in server-side API routes failing to authenticate with Supabase in production.

### Solution Applied
1. **Standardized environment variable usage** across all API routes
2. **Updated the following files** to use the correct environment variable name:
   - `src/app/api/statements/[id]/details/route.ts`
   - `src/app/api/statements/[id]/route.ts`
   - `src/app/api/statements/[id]/computed/route.ts`
   - `src/app/api/test-notifications/route.ts`
   - `src/app/api/debug-notifications/route.ts`
   - `src/app/api/fix-invoice-rls/route.ts`

3. **Added fallback environment variable** in both `.env` and `.env.production` files

### Files Modified

#### API Routes
```typescript
// BEFORE (Incorrect)
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, // Wrong variable name
  // ... rest of config
);

// AFTER (Correct)
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!, // Correct variable name
  // ... rest of config
);
```

#### Environment Files
```env
# Added for compatibility
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_aHCVwZ2OAJSAgW7Y447X6Q_vb5mG2xw
```

### Verification Steps
1. **Build Check**: Run `npm run build` to ensure no compilation errors
2. **Environment Check**: Verify all environment variables are properly defined
3. **API Test**: Test invoice loading functionality in production
4. **Console Check**: Ensure no JavaScript errors in browser console

### Prevention Measures
1. **Consistent Naming**: Always use standardized environment variable names
2. **Code Review**: Review environment variable usage in API routes
3. **Testing**: Test both local and production environments before deployment
4. **Documentation**: Keep environment variable documentation updated

## Common Environment Variable Issues

### Missing Environment Variables
**Symptoms**: Server configuration errors, authentication failures
**Solution**: 
1. Check `.env`, `.env.local`, and `.env.production` files
2. Ensure all required variables are defined
3. Verify variable names match exactly in code

### Supabase Authentication Issues
**Symptoms**: 401 Unauthorized errors, session failures
**Check**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Environment Variable Naming
**Best Practices**:
- Use consistent naming across all files
- Prefix client-side variables with `NEXT_PUBLIC_`
- Keep server-side variables without prefix
- Document all environment variables

## Debugging Steps

### 1. Check Environment Variables
```bash
# In production
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
echo $SUPABASE_SERVICE_ROLE_KEY
```

### 2. API Route Debugging
Add logging to API routes:
```typescript
console.log("Environment check:", {
  url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  publishable: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
  service: !!process.env.SUPABASE_SERVICE_ROLE_KEY
});
```

### 3. Browser Console
Check for:
- JavaScript errors
- Network request failures
- Authentication errors

### 4. Server Logs
Monitor server logs for:
- Environment variable errors
- Supabase connection failures
- API route errors

## Production Deployment Checklist

### Pre-Deployment
- [ ] Environment variables defined correctly
- [ ] Build completes successfully
- [ ] All API routes tested
- [ ] No console errors in development

### Post-Deployment
- [ ] Invoice loading works correctly
- [ ] API routes respond properly
- [ ] Authentication functions properly
- [ ] No server errors in logs

### Environment Files
- [ ] `.env.production` contains all required variables
- [ ] Variable names match code usage
- [ ] Supabase keys are valid and active

## Additional Notes

### Environment Variable Priority
Next.js loads environment variables in this order:
1. `.env.local` (always loaded, ignored by git)
2. `.env.production` (production only)
3. `.env` (fallback)

### Supabase Client Types
- **Browser Client**: Uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- **Server Client**: Uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` with cookies
- **Service Role Client**: Uses `SUPABASE_SERVICE_ROLE_KEY` (admin access)

### Security Considerations
- Never expose service role keys to client-side
- Keep environment files secure
- Rotate keys regularly
- Use different keys for different environments

## Contact Information
For additional support or questions about production issues, refer to:
- Next.js Documentation: https://nextjs.org/docs
- Supabase Documentation: https://supabase.com/docs
- Project Documentation: README.md