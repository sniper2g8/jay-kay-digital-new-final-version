-- Consolidate customer data strategy
-- Option 1: Enhanced customers table with appUsers relationship

-- First, let's see what we have in both tables
-- This migration will:
-- 1. Add customer-specific columns to customers table
-- 2. Add a foreign key relationship to appUsers for user account data
-- 3. Remove redundant columns from customers that exist in appUsers

BEGIN;

-- Add customer-specific columns that don't overlap with appUsers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS business_email TEXT; -- Different from user email
ALTER TABLE customers ADD COLUMN IF NOT EXISTS business_phone TEXT; -- Different from user phone
ALTER TABLE customers ADD COLUMN IF NOT EXISTS business_address TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_status TEXT DEFAULT 'active';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_type TEXT DEFAULT 'business'; -- 'individual' or 'business'

-- Add relationship to appUsers (if user has an account)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS app_user_id TEXT REFERENCES appUsers(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_customers_app_user_id ON customers(app_user_id);
CREATE INDEX IF NOT EXISTS idx_customers_business_name ON customers(business_name);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(customer_status);

-- Remove redundant columns that should come from appUsers
-- (Keep name as business_name might be different from user name)
-- ALTER TABLE customers DROP COLUMN IF EXISTS name; -- We'll keep this as it might be different from appUsers.name

COMMIT;

-- Migration Notes:
-- 1. business_email/business_phone separate from appUsers email/phone for companies
-- 2. contact_person for who to speak with (might not be the account holder)
-- 3. app_user_id links to appUsers when customer has an account
-- 4. Customers can exist without appUsers accounts (walk-in customers)
-- 5. appUsers can exist without being customers (employees, etc.)
