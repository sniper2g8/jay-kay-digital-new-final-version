-- Step 2: Add constraints and indexes
-- Execute this after step 1 completes successfully

-- Add check constraints
ALTER TABLE customers ADD CONSTRAINT chk_customer_status 
  CHECK (customer_status IN ('active', 'inactive', 'pending'));

ALTER TABLE customers ADD CONSTRAINT chk_customer_type 
  CHECK (customer_type IN ('business', 'individual'));

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_customers_app_user_id ON customers(app_user_id);
CREATE INDEX IF NOT EXISTS idx_customers_business_name ON customers(business_name);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(customer_status);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
