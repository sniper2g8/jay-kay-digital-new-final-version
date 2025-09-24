# Invoice Items API Debug Steps

## Critical Issue
GET http://localhost:3000/api/invoice-items/d05a5002-33f2-4219-9d1b-236d23328af2
Returns [HTTP/1.1 500 Internal Server Error]

## Debugging Scripts Created

### 1. [debug-current-rls-status.sql](file://d:\Web%20Apps\jay-kay-digital-press-new\scripts\debug-current-rls-status.sql)
- Check RLS status and policies on invoice_items table
- Verify data access as service role
- Check specific invoice ID that's failing
- Verify if the invoice exists

### 2. [debug-invoice-existence.sql](file://d:\Web%20Apps\jay-kay-digital-press-new\scripts\debug-invoice-existence.sql)
- Check if the specific invoice exists
- Check if there are invoice items for this invoice
- Verify item count
- List policies that might be blocking access

### 3. [debug-user-role.sql](file://d:\Web%20Apps\jay-kay-digital-press-new\scripts\debug-user-role.sql)
- Check the user's role (user ID: 337eb073-1bfd-4879-94b7-653bda239e06)
- Verify if this user has admin privileges
- Check policies that might affect this user

### 4. [debug-service-role.sql](file://d:\Web%20Apps\jay-kay-digital-press-new\scripts\debug-service-role.sql)
- Check current database roles
- Test basic data access
- Verify service role configuration

### 5. [comprehensive-debug.sql](file://d:\Web%20Apps\jay-kay-digital-press-new\scripts\comprehensive-debug.sql)
- Comprehensive check of all possible issues
- Invoice existence
- Item existence
- RLS status
- Policy count
- Service role
- User role
- Admin privileges

### 6. [test-api-route-locally.sql](file://d:\Web%20Apps\jay-kay-digital-press-new\scripts\test-api-route-locally.sql)
- Simulate the queries the API route runs
- Check for constraints or triggers
- Verify related functions

### 7. [debug-specific-invoice.sql](file://d:\Web%20Apps\jay-kay-digital-press-new\scripts\debug-specific-invoice.sql)
- Debug the specific invoice causing issues
- Check item details
- Verify data integrity

### 8. [debug-supabase-config.sql](file://d:\Web%20Apps\jay-kay-digital-press-new\scripts\debug-supabase-config.sql)
- Check RLS policies
- Verify auth schema access
- Check for auth.uid() function

### 9. [debug-exact-error.sql](file://d:\Web%20Apps\jay-kay-digital-press-new\scripts\debug-exact-error.sql)
- Test the exact query failing in API route
- Check for data issues
- Verify triggers and functions

## Recommended Execution Order
1. Run [comprehensive-debug.sql](file://d:\Web%20Apps\jay-kay-digital-press-new\scripts\comprehensive-debug.sql) first to get an overview
2. Run [debug-current-rls-status.sql](file://d:\Web%20Apps\jay-kay-digital-press-new\scripts\debug-current-rls-status.sql) to check RLS status
3. Run [debug-exact-error.sql](file://d:\Web%20Apps\jay-kay-digital-press-new\scripts\debug-exact-error.sql) to test the specific failing query
4. Run other scripts as needed based on findings

## Expected Outcomes
- Identify if the issue is with RLS policies
- Determine if the invoice/invoice items exist
- Verify service role configuration
- Check user permissions
- Find any data integrity issues