-- Complete script to create statement tables and apply proper RLS policies

-- =====================================================
-- CUSTOMER STATEMENTS SYSTEM - Database Schema
-- =====================================================

-- 1. Customer Statement Periods (Monthly/Quarterly statements)
CREATE TABLE IF NOT EXISTS customer_statement_periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,

  -- Statement Period
  statement_number VARCHAR(50) UNIQUE NOT NULL, -- STMT-CUST001-2024-09
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  statement_date DATE DEFAULT CURRENT_DATE,

  -- Balance Information
  opening_balance DECIMAL(10,2) DEFAULT 0,
  closing_balance DECIMAL(10,2) DEFAULT 0,
  current_balance DECIMAL(10,2) DEFAULT 0, -- Live balance including new transactions
  
  -- Transaction Summary
  total_charges DECIMAL(10,2) DEFAULT 0,    -- Jobs, services added
  total_payments DECIMAL(10,2) DEFAULT 0,   -- Payments received
  total_adjustments DECIMAL(10,2) DEFAULT 0, -- Credits, refunds, corrections

  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'sent', 'viewed', 'paid')),
  is_current_period BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID, -- Staff member who generated statement
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,

  UNIQUE(customer_id, period_start, period_end)
);

-- 2. Customer Statement Transactions (Individual line items)
CREATE TABLE IF NOT EXISTS customer_statement_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  statement_period_id UUID REFERENCES customer_statement_periods(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Transaction Details
  transaction_date DATE NOT NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('charge', 'payment', 'adjustment', 'credit')),
  description TEXT,
  reference_number VARCHAR(50),
  
  -- Amounts
  amount DECIMAL(10,2) NOT NULL,
  running_balance DECIMAL(10,2) NOT NULL,
  
  -- Related Entities
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID, -- Staff member who created transaction
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Customer Account Balances (Current balances and credit info)
CREATE TABLE IF NOT EXISTS customer_account_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Balance Information
  current_balance DECIMAL(10,2) DEFAULT 0,
  outstanding_invoices DECIMAL(10,2) DEFAULT 0,
  credits_available DECIMAL(10,2) DEFAULT 0,
  credit_limit DECIMAL(10,2) DEFAULT 0,
  credit_used DECIMAL(10,2) DEFAULT 0,
  
  -- Payment Terms
  payment_terms_days INTEGER DEFAULT 30,
  
  -- Dates
  last_transaction_date DATE,
  last_payment_date DATE,
  last_statement_date DATE,
  
  -- Status
  account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'closed')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Statement Settings (Company info and formatting)
CREATE TABLE IF NOT EXISTS statement_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Settings
  auto_generate_monthly BOOLEAN DEFAULT FALSE,
  statement_due_days INTEGER DEFAULT 30,
  
  -- Company Info
  company_logo_url TEXT,
  company_address TEXT,
  company_phone VARCHAR(20),
  company_email VARCHAR(255),
  
  -- Statement Content
  header_text TEXT,
  footer_text TEXT,
  payment_instructions TEXT,
  
  -- Formatting
  currency_symbol VARCHAR(5) DEFAULT 'SLL',
  date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Statement Periods Indexes
CREATE INDEX IF NOT EXISTS idx_statement_periods_customer_id ON customer_statement_periods(customer_id);
CREATE INDEX IF NOT EXISTS idx_statement_periods_date_range ON customer_statement_periods(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_statement_periods_current ON customer_statement_periods(is_current_period) WHERE is_current_period = TRUE;
CREATE INDEX IF NOT EXISTS idx_statement_periods_status ON customer_statement_periods(status);

-- Statement Transactions Indexes
CREATE INDEX IF NOT EXISTS idx_statement_transactions_period ON customer_statement_transactions(statement_period_id);
CREATE INDEX IF NOT EXISTS idx_statement_transactions_customer ON customer_statement_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_statement_transactions_date ON customer_statement_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_statement_transactions_type ON customer_statement_transactions(transaction_type);

-- Account Balances Indexes
CREATE INDEX IF NOT EXISTS idx_account_balances_customer ON customer_account_balances(customer_id);
CREATE INDEX IF NOT EXISTS idx_account_balances_status ON customer_account_balances(account_status);

-- =====================================================
-- TRIGGERS FOR AUTOMATED UPDATES
-- =====================================================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for statement periods
DROP TRIGGER IF EXISTS update_statement_periods_updated_at ON customer_statement_periods;
CREATE TRIGGER update_statement_periods_updated_at 
    BEFORE UPDATE ON customer_statement_periods 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers for statement transactions
DROP TRIGGER IF EXISTS update_statement_transactions_updated_at ON customer_statement_transactions;
CREATE TRIGGER update_statement_transactions_updated_at 
    BEFORE UPDATE ON customer_statement_transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers for account balances
DROP TRIGGER IF EXISTS update_account_balances_updated_at ON customer_account_balances;
CREATE TRIGGER update_account_balances_updated_at 
    BEFORE UPDATE ON customer_account_balances 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers for statement settings
DROP TRIGGER IF EXISTS update_statement_settings_updated_at ON statement_settings;
CREATE TRIGGER update_statement_settings_updated_at 
    BEFORE UPDATE ON statement_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS on all statement tables
ALTER TABLE customer_statement_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_statement_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_account_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE statement_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all statement periods" ON customer_statement_periods;
DROP POLICY IF EXISTS "Authenticated users can insert statement periods" ON customer_statement_periods;
DROP POLICY IF EXISTS "Authenticated users can update statement periods" ON customer_statement_periods;
DROP POLICY IF EXISTS "Users can view all statement transactions" ON customer_statement_transactions;
DROP POLICY IF EXISTS "Authenticated users can insert statement transactions" ON customer_statement_transactions;
DROP POLICY IF EXISTS "Users can view all account balances" ON customer_account_balances;
DROP POLICY IF EXISTS "Authenticated users can manage account balances" ON customer_account_balances;
DROP POLICY IF EXISTS "Users can view statement settings" ON statement_settings;
DROP POLICY IF EXISTS "Authenticated users can update statement settings" ON statement_settings;

-- Service role bypass policies (allow server-side operations)
CREATE POLICY "service_role_bypass_statement_periods" 
ON customer_statement_periods 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "service_role_bypass_statement_transactions" 
ON customer_statement_transactions 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "service_role_bypass_account_balances" 
ON customer_account_balances 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "service_role_bypass_statement_settings" 
ON statement_settings 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Create proper policies for statement periods
-- Admins and staff can view all statement periods
-- Customers can only view their own statement periods
CREATE POLICY "Admins and staff can view all statement periods" 
ON customer_statement_periods 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
  )
  OR customer_id = auth.uid()::text
);

-- Authenticated users can insert statement periods (for admin/staff)
CREATE POLICY "Authenticated users can insert statement periods" 
ON customer_statement_periods 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own statement periods or admins/staff can update any
CREATE POLICY "Users can update statement periods" 
ON customer_statement_periods 
FOR UPDATE 
USING (
  customer_id = auth.uid()::text
  OR EXISTS (
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
  )
);

-- Allow deletion for admins/staff
CREATE POLICY "Admins and staff can delete statement periods" 
ON customer_statement_periods 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
  )
);

-- Create proper policies for statement transactions
-- Users can view transactions for their own statement periods
-- Admins and staff can view all transactions
CREATE POLICY "Users can view statement transactions" 
ON customer_statement_transactions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM customer_statement_periods 
    WHERE customer_statement_periods.id = customer_statement_transactions.statement_period_id
    AND (
      customer_statement_periods.customer_id = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM "appUsers" 
        WHERE id = auth.uid() 
        AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
      )
    )
  )
);

-- Authenticated users can insert statement transactions (for admin/staff)
CREATE POLICY "Authenticated users can insert statement transactions" 
ON customer_statement_transactions 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow updates for admins/staff
CREATE POLICY "Admins and staff can update statement transactions" 
ON customer_statement_transactions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
  )
);

-- Allow deletion for admins/staff
CREATE POLICY "Admins and staff can delete statement transactions" 
ON customer_statement_transactions 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
  )
);

-- Create proper policies for account balances
-- Users can view their own account balances
-- Admins and staff can view all account balances
CREATE POLICY "Users can view account balances" 
ON customer_account_balances 
FOR SELECT 
USING (
  customer_id = auth.uid()::text
  OR EXISTS (
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
  )
);

-- Authenticated users can update account balances (for admin/staff)
CREATE POLICY "Admins and staff can update account balances" 
ON customer_account_balances 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
  )
);

-- Create proper policies for statement settings
-- All authenticated users can view settings
CREATE POLICY "Users can view statement settings" 
ON statement_settings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Only admins can update settings
CREATE POLICY "Admins can update statement settings" 
ON statement_settings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "appUsers" 
    WHERE id = auth.uid() 
    AND primary_role IN ('admin', 'super_admin')
  )
);

-- Grant necessary permissions
GRANT ALL ON customer_statement_periods TO authenticated;
GRANT ALL ON customer_statement_transactions TO authenticated;
GRANT ALL ON customer_account_balances TO authenticated;
GRANT ALL ON statement_settings TO authenticated;

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default statement settings if they don't exist
INSERT INTO statement_settings (
  auto_generate_monthly,
  statement_due_days,
  company_address,
  company_phone,
  company_email,
  payment_instructions,
  currency_symbol
) VALUES (
  TRUE,
  30,
  'Jay Kay Digital Press
St. Edward School Avenue, By Caritas
Freetown, Sierra Leone',
  '+232 34 788711',
  'jaykaydigitalpress@gmail.com',
  'Payment is due within 30 days of statement date. Please include your account number with payment.',
  'SLL'
) ON CONFLICT DO NOTHING;