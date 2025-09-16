# Password Recovery Configuration Fix

## 🚨 ISSUE IDENTIFIED
Error: "Unable to process request" (500 Internal Server Error)

## 🔧 SOLUTIONS TO IMPLEMENT

### 1. SUPABASE DASHBOARD CONFIGURATION ⭐ MOST LIKELY FIX

Go to your Supabase Dashboard and check these settings:

#### A. Site URL Configuration
1. Go to: **Authentication > Settings > General**
2. Set **Site URL** to: `http://localhost:3000` (for development)
3. For production, add your production domain

#### B. Redirect URLs Configuration  
1. Go to: **Authentication > Settings > General**
2. Add these **Redirect URLs**:
   - `http://localhost:3000/**`
   - `http://localhost:3000/auth/reset-password`
   - `http://localhost:3000/auth/*`

#### C. Email Templates
1. Go to: **Authentication > Templates**
2. Check that **Reset Password** template is enabled
3. Verify the template has correct variables and formatting

#### D. SMTP Configuration (if using custom email)
1. Go to: **Authentication > Settings > SMTP Settings**
2. If using custom SMTP, ensure all settings are correct
3. If NOT using custom SMTP, disable it to use Supabase's built-in email

### 2. ENVIRONMENT VARIABLES CHECK ✅
Your environment variables look correct:
- NEXT_PUBLIC_SUPABASE_URL: ✅ Valid
- NEXT_PUBLIC_SUPABASE_ANON_KEY: ✅ Valid

### 3. CODE FIXES (Apply these if dashboard fixes don't work)

#### A. Enhanced Error Handling
Update the resetPasswordForEmail function with better error handling.

#### B. Alternative Reset URL
Try using window.location.origin dynamically instead of hardcoded URL.

### 4. DEBUGGING STEPS

#### A. Check Supabase Auth Logs
1. Go to: **Logs > Auth Logs** in Supabase Dashboard
2. Look for recent password reset attempts
3. Check for specific error messages

#### B. Test with Different Email
Try password reset with different email addresses to see if issue is user-specific.

## 🎯 PRIORITY ORDER
1. **Fix Supabase Dashboard Settings** (Most likely fix)
2. **Check Auth Logs** for specific errors
3. **Apply code improvements** if needed
4. **Test with multiple emails**

## 🚀 EXPECTED RESULT
After fixing Supabase settings, password recovery should work and users should receive reset emails.