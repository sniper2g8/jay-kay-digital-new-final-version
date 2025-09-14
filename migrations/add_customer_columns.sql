-- Migration to add missing columns to customers table for Jay Kay Digital Press
-- This aligns the database schema with the application requirements

ALTER TABLE customers ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));
ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update the existing 'name' column to be 'business_name' if it's empty
UPDATE customers SET business_name = name WHERE business_name IS NULL AND name IS NOT NULL;

-- Rename the human_id column to customer_human_id for consistency
ALTER TABLE customers RENAME COLUMN human_id TO customer_human_id;

-- Add any missing default values
UPDATE customers SET status = 'active' WHERE status IS NULL;
