# Diagnostic Scripts for Invoice Items RLS Issue

This directory contains several diagnostic and fix scripts to help resolve the Row Level Security (RLS) issue with the invoice_items table.

## Scripts Overview

### 1. check-current-rls.sql

Checks the current RLS status and policies for both `invoice_items` and `invoice_line_items` tables.

**Purpose**: Diagnose current RLS configuration
**Usage**: Run in Supabase SQL editor

### 2. simple-data-check.sql

Simple data access check for both tables.

**Purpose**: Verify if data can be accessed in both tables
**Usage**: Run in Supabase SQL editor

### 3. role-access-test.sql

Check database roles and test access with different roles.

**Purpose**: Understand role configuration and permissions
**Usage**: Run in Supabase SQL editor

### 4. compare-tables-structure.sql

Compare the structure of `invoice_items` and `invoice_line_items` tables.

**Purpose**: Identify structural differences between tables
**Usage**: Run in Supabase SQL editor

### 5. fix-invoice-items-rls.sql

Fix RLS policies for the `invoice_items` table.

**Purpose**: Correct RLS policies to allow proper access
**Usage**: Run in Supabase SQL editor with appropriate privileges

## Recommended Execution Order

1. Run `check-current-rls.sql` to see current RLS configuration
2. Run `simple-data-check.sql` to verify data access
3. Run `compare-tables-structure.sql` to understand table differences
4. Run `role-access-test.sql` to check role configuration
5. If issues are identified, run `fix-invoice-items-rls.sql` to correct RLS policies

## Troubleshooting

If you encounter errors when running these scripts:

1. Ensure you're running them in the Supabase SQL editor with sufficient privileges
2. Check that table names match your actual database schema
3. Verify that the service role key is properly configured in your environment variables
