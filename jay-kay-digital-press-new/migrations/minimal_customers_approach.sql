-- Alternative: Minimal customers table with appUsers relationship
-- This keeps customers lean and leverages appUsers for contact data

BEGIN;

-- Customers table becomes primarily business/relationship data
ALTER TABLE customers ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_type TEXT DEFAULT 'business'; -- 'individual' or 'business'
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_status TEXT DEFAULT 'active';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS payment_terms TEXT; -- Net 30, etc.
ALTER TABLE customers ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(10,2);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tax_id TEXT;

-- Link to appUsers for contact information
ALTER TABLE customers ADD COLUMN IF NOT EXISTS app_user_id TEXT REFERENCES appUsers(id);

-- For customers without user accounts, we can optionally store basic contact info
ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_email TEXT; -- Only when no appUsers link
ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_phone TEXT; -- Only when no appUsers link
ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_address TEXT; -- Only when no appUsers link

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customers_app_user_id ON customers(app_user_id);
CREATE INDEX IF NOT EXISTS idx_customers_business_name ON customers(business_name);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(customer_status);

-- Add constraint to ensure either app_user_id exists OR contact info is provided
ALTER TABLE customers ADD CONSTRAINT chk_customer_contact 
  CHECK (
    app_user_id IS NOT NULL OR 
    (contact_email IS NOT NULL OR contact_phone IS NOT NULL)
  );

COMMIT;

-- This approach:
-- 1. Eliminates redundancy completely
-- 2. Uses appUsers as single source of truth for contact data when account exists
-- 3. Allows customers without accounts (contact_* fields)
-- 4. Focuses customers table on business relationship data
-- 5. Keeps data normalized and consistent
