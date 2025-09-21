# Fix All Tables RLS (Row Level Security)

## Problem Analysis

The "Error fetching statement periods: {}" and other similar errors occur because several tables in the database don't have proper Row Level Security (RLS) policies configured. This prevents even the service role from accessing these tables.

From our testing, we found that:
- ✅ [appUsers](file://d:\Web%20Apps\jay-kay-digital-press-new\src\lib\hooks\useUserRole.ts#L31-L38), [notifications](file://d:\Web%20Apps\jay-kay-digital-press-new\src\app\api\notifications\test\route.ts#L43-L43), and [notification_preferences](file://d:\Web%20Apps\jay-kay-digital-press-new\src\app\api\notifications\preferences\route.ts#L51-L51) tables are accessible
- ❌ Core business tables ([customers](file://d:\Web%20Apps\jay-kay-digital-press-new\src\app\dashboard\payments\page.tsx#L34-L34), [jobs](file://d:\Web%20Apps\jay-kay-digital-press-new\src\app\dashboard\analytics\page.tsx#L122-L129), [invoices](file://d:\Web%20Apps\jay-kay-digital-press-new\src\app\dashboard\payments\page.tsx#L33-L33), [payments](file://d:\Web%20Apps\jay-kay-digital-press-new\src\components\SupabaseConnectionTest.tsx#L28-L31)) are not accessible due to missing RLS policies
- ❌ Statement tables are not accessible due to missing RLS policies

## Solution

We've created a comprehensive SQL script that fixes RLS policies for all tables:

### Files Created:
1. [complete-rls-fix.sql](file://d:\Web%20Apps\jay-kay-digital-press-new\complete-rls-fix.sql) - Fixes RLS policies for all existing tables
2. [create-and-fix-statement-tables.sql](file://d:\Web%20Apps\jay-kay-digital-press-new\create-and-fix-statement-tables.sql) - Creates statement tables and applies RLS policies
3. [fix-core-tables-rls.sql](file://d:\Web%20Apps\jay-kay-digital-press-new\fix-core-tables-rls.sql) - Fixes RLS policies for core business tables only
4. [fix-statement-tables-rls-only.sql](file://d:\Web%20Apps\jay-kay-digital-press-new\fix-statement-tables-rls-only.sql) - Fixes RLS policies for statement tables only

## Implementation Steps

### 1. Apply RLS Policies for Existing Tables
1. Open [complete-rls-fix.sql](file://d:\Web%20Apps\jay-kay-digital-press-new\complete-rls-fix.sql)
2. Copy the content
3. Paste it into your Supabase SQL Editor
4. Run the query

This will:
- Enable RLS on all tables
- Create service role bypass policies (allowing server-side operations)
- Create appropriate user access policies
- Grant necessary permissions

### 2. Create Statement Tables (if needed)
If the statement tables don't exist yet:
1. Open [create-and-fix-statement-tables.sql](file://d:\Web%20Apps\jay-kay-digital-press-new\create-and-fix-statement-tables.sql)
2. Copy the content
3. Paste it into your Supabase SQL Editor
4. Run the query

This will:
- Create all statement-related tables
- Apply proper indexes and constraints
- Set up triggers for automated updates
- Configure RLS policies

### 3. Verify Implementation
Run the test script to verify all tables are now accessible:
```bash
node test-all-tables-access.cjs
```

All tables should show as "Accessible" with green checkmarks.

### 4. Test in Browser
1. Start your Next.js development server:
   ```bash
   pnpm dev
   ```
2. Navigate to the statements page
3. Check that the "Error fetching statement periods: {}" error no longer appears

## RLS Policy Design

The RLS policies follow these security principles:

### Service Role Bypass
- All tables have policies that allow the service role to bypass RLS
- This enables server-side operations to access all records when needed

### Role-Based Access Control
- **Admins and Staff**: Can view, create, update, and delete all records in their domain
- **Customers**: Can only view, update, and delete their own records
- **Authenticated Users**: Can perform operations based on their role permissions

### Specific Policies
1. **Customers**: Can view their own records or records linked to their user account
2. **Jobs/Invoices/Payments**: Can be accessed by admins/staff or by customers who own the related customer record
3. **Statements**: Can be accessed by admins/staff or by customers who own the statement
4. **App Users**: Can view and update their own profiles only
5. **Notifications**: Can view their own notifications only

## Verification Checklist

Before deploying to production, verify that:

- [ ] All core business tables are accessible
- [ ] All statement tables are accessible (if they exist)
- [ ] Service role can access all tables
- [ ] Admin users can view all records
- [ ] Customer users can only view their own records
- [ ] No console errors appear when accessing business data
- [ ] Statement periods load correctly in the UI

## Troubleshooting

### If Tables Still Show Permission Errors
1. Verify the SQL script executed without errors
2. Check Supabase SQL Editor execution logs
3. Confirm you're using the correct service role key

### If Console Errors Continue
1. Check browser console for detailed error messages
2. Verify the enhanced logging is working in the React hooks
3. Confirm network requests are successful

### If Statement Tables Don't Exist
1. Run the [create-and-fix-statement-tables.sql](file://d:\Web%20Apps\jay-kay-digital-press-new\create-and-fix-statement-tables.sql) script
2. Verify table creation in Supabase Table Editor
3. Confirm RLS policies are applied

The fixes implemented in this guide should resolve all "Error fetching..." issues and provide a solid foundation for the entire application with proper security controls.