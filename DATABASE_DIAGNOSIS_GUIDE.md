# Database Diagnosis Guide

This guide explains the scripts created to diagnose and fix database connection and permission issues in your Supabase project.

## Overview of Created Scripts

### 1. Environment Configuration
- **File**: `.env.local`
- **Purpose**: Store all necessary credentials and configuration
- **Usage**: Fill in with your actual Supabase credentials

### 2. Direct PostgreSQL Connection Test
- **File**: `test-direct-postgres.mjs`
- **Purpose**: Test direct connection to PostgreSQL database
- **Usage**: `node test-direct-postgres.mjs`

### 3. Comprehensive Database Tests
- **File**: `comprehensive-db-test.mjs`
- **Purpose**: Test all connection methods (anon key, service role, direct PostgreSQL)
- **Usage**: `node comprehensive-db-test.mjs`

### 4. RLS and Ownership Checker
- **File**: `check-rls-and-ownership.mjs`
- **Purpose**: Check current RLS policies and table ownership
- **Usage**: `node check-rls-and-ownership.mjs`

### 5. Statement Tables Diagnostics
- **File**: `diagnose-statement-tables.mjs`
- **Purpose**: Deep dive into statement table issues
- **Usage**: `node diagnose-statement-tables.mjs`

## Step-by-Step Diagnosis Process

### Step 1: Configure Environment Variables
1. Open `.env.local`
2. Replace placeholder values with your actual credentials:
   - Get from Supabase Dashboard > Project Settings > API:
     - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (anon key)
     - `SUPABASE_SERVICE_ROLE_KEY` (service role key)
   - Get from Supabase Dashboard > Project Settings > Database:
     - `SUPABASE_DB_PASSWORD` (database password)

### Step 2: Test Direct PostgreSQL Connection
Run:
```bash
node test-direct-postgres.mjs
```

Expected outcome:
- ✅ Connected to PostgreSQL database!
- Access to all tables should work

### Step 3: Run Comprehensive Tests
Run:
```bash
node comprehensive-db-test.mjs
```

This will test:
1. Supabase client with anon key
2. Supabase client with service role key
3. Direct PostgreSQL connection

### Step 4: Check RLS Policies and Ownership
Run:
```bash
node check-rls-and-ownership.mjs
```

This will show:
- RLS status for each table
- Current policies
- Table ownership

### Step 5: Diagnose Statement Tables
Run:
```bash
node diagnose-statement-tables.mjs
```

This will show:
- Structure of statement tables
- Constraints and relationships
- Access permissions

## Common Issues and Solutions

### Issue 1: Permission Denied Errors
**Symptoms**: 
- "permission denied for table customer_statement_periods"
- Service role can access some tables but not others

**Solutions**:
1. Run `check-rls-and-ownership.mjs` to verify table ownership
2. Ensure all tables are owned by the `postgres` user
3. Apply the `grant-service-role-permissions.sql` script if needed

### Issue 2: RLS Policy Errors
**Symptoms**:
- "operator does not exist: text = uuid" errors
- Type casting issues in policies

**Solutions**:
1. Review the `final-rls-fix.sql` script
2. Ensure proper type casting (use `::text` for text columns compared to `auth.uid()`)

### Issue 3: Connection Issues
**Symptoms**:
- DNS resolution errors
- Connection timeouts

**Solutions**:
1. Verify your network connection
2. Check if your IP is whitelisted in Supabase
3. Try using a VPN if behind a corporate firewall

## Next Steps

1. Run all diagnostic scripts and note the outputs
2. Share the results with your development team
3. Based on the findings, apply the appropriate fixes:
   - If ownership issues: Run ownership correction scripts
   - If RLS issues: Apply corrected RLS policies
   - If permission issues: Grant necessary permissions to service role

## Additional Resources

- [Supabase Documentation on RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Documentation on Permissions](https://www.postgresql.org/docs/current/ddl-priv.html)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooling)