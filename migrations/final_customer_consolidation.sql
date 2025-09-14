-- Final Migration: Consolidate Customer Data Strategy
-- This eliminates redundancy between appUsers and customers tables
-- while maintaining clear separation of concerns

BEGIN;

-- Add all customer-specific columns to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS business_name TEXT NOT NULL DEFAULT 'Unknown Business';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_status TEXT DEFAULT 'active' CHECK (customer_status IN ('active', 'inactive', 'pending'));
ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_type TEXT DEFAULT 'business' CHECK (customer_type IN ('business', 'individual'));

-- Optional link to appUsers for customers who have user accounts
ALTER TABLE customers ADD COLUMN IF NOT EXISTS app_user_id TEXT REFERENCES appUsers(id) ON DELETE SET NULL;

-- Business-specific fields
ALTER TABLE customers ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT 'Net 30';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tax_id TEXT;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_customers_app_user_id ON customers(app_user_id);
CREATE INDEX IF NOT EXISTS idx_customers_business_name ON customers(business_name);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(customer_status);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Update existing customers with default business names based on their current name
UPDATE customers 
SET business_name = COALESCE(name, 'Customer ' || human_id)
WHERE business_name IS NULL OR business_name = 'Unknown Business';

-- Now that business_name is populated, we can make it NOT NULL
ALTER TABLE customers ALTER COLUMN business_name SET NOT NULL;

COMMIT;

-- Post-migration considerations:
-- 1. customers table is now the authoritative source for customer data
-- 2. appUsers remains for user account management (login, roles, etc.)
-- 3. Customers can exist without appUsers accounts (walk-in customers)
-- 4. appUsers can exist without being customers (employees, vendors, etc.)
-- 5. No more data duplication between tables
-- 6. Clear separation: customers = business relationships, appUsers = system access
