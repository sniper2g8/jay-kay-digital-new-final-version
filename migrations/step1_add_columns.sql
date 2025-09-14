-- Execute this SQL in Supabase Dashboard > SQL Editor
-- Customer Consolidation Migration
-- This adds all necessary columns to the customers table

-- Add customer-specific columns
ALTER TABLE customers ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_status TEXT DEFAULT 'active';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_type TEXT DEFAULT 'business';

-- Optional link to appUsers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS app_user_id TEXT REFERENCES "appUsers"(id) ON DELETE SET NULL;

-- Business-specific fields
ALTER TABLE customers ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT 'Net 30';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tax_id TEXT;
