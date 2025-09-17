const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://pnoxqzlxfuvjvufdjuqh.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBub3hxemx4ZnV2anZ1ZmRqdXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczOTMxMzMsImV4cCI6MjA3Mjk2OTEzM30.QG0B60xV9TO2PaUeEOkzgqXcVuSkHVq3yYfXWKaaDzc";

const supabase = createClient(supabaseUrl, supabaseKey);

async function createCustomerStatementsSchema() {
  console.log("🏗️  Creating Customer Statements System (Production Version)");
  console.log("==========================================================\n");

  try {
    console.log(
      "📋 Creating customer statements tables WITHOUT sample data...",
    );

    console.log("⚠️  Table creation needs to be done via Supabase SQL Editor");
    console.log("\n📝 SQL to execute in Supabase Dashboard:");
    console.log("=====================================");

    const createTablesSQL = `
-- =====================================================
-- CUSTOMER STATEMENTS SYSTEM - Database Schema (Production)
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
  description TEXT NOT NULL,
  reference_number VARCHAR(100), -- Job number, invoice number, payment reference
  
  -- Financial Impact
  amount DECIMAL(10,2) NOT NULL,
  running_balance DECIMAL(10,2) NOT NULL,
  
  -- References
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  invoice_id UUID, -- When invoices table is created
  payment_id UUID, -- When payments table is created
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- 3. Customer Account Balances (Current balance tracking)
CREATE TABLE IF NOT EXISTS customer_account_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Current Balances
  current_balance DECIMAL(10,2) DEFAULT 0,
  outstanding_invoices DECIMAL(10,2) DEFAULT 0,
  credits_available DECIMAL(10,2) DEFAULT 0,
  
  -- Credit Limits
  credit_limit DECIMAL(10,2) DEFAULT 0,
  credit_used DECIMAL(10,2) DEFAULT 0,
  
  -- Payment Terms
  payment_terms_days INTEGER DEFAULT 30,
  
  -- Last Activity
  last_transaction_date DATE,
  last_payment_date DATE,
  last_statement_date DATE,
  
  -- Status
  account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'closed')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Statement Templates and Settings
CREATE TABLE IF NOT EXISTS statement_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Generation Settings
  auto_generate_monthly BOOLEAN DEFAULT TRUE,
  statement_due_days INTEGER DEFAULT 30,
  
  -- Template Settings
  company_logo_url TEXT,
  company_address TEXT,
  company_phone VARCHAR(20),
  company_email VARCHAR(100),
  
  -- Statement Text
  header_text TEXT DEFAULT 'Account Statement',
  footer_text TEXT DEFAULT 'Thank you for your business!',
  payment_instructions TEXT,
  
  -- Formatting
  currency_symbol VARCHAR(5) DEFAULT '$',
  date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Statement Periods
CREATE INDEX IF NOT EXISTS idx_statement_periods_customer_id ON customer_statement_periods(customer_id);
CREATE INDEX IF NOT EXISTS idx_statement_periods_date_range ON customer_statement_periods(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_statement_periods_current ON customer_statement_periods(is_current_period) WHERE is_current_period = TRUE;
CREATE INDEX IF NOT EXISTS idx_statement_periods_status ON customer_statement_periods(status);

-- Statement Transactions
CREATE INDEX IF NOT EXISTS idx_statement_transactions_period ON customer_statement_transactions(statement_period_id);
CREATE INDEX IF NOT EXISTS idx_statement_transactions_customer ON customer_statement_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_statement_transactions_date ON customer_statement_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_statement_transactions_type ON customer_statement_transactions(transaction_type);

-- Account Balances
CREATE INDEX IF NOT EXISTS idx_account_balances_customer ON customer_account_balances(customer_id);
CREATE INDEX IF NOT EXISTS idx_account_balances_status ON customer_account_balances(account_status);

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_statement_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_statement_periods_updated_at ON customer_statement_periods;
CREATE TRIGGER update_statement_periods_updated_at
  BEFORE UPDATE ON customer_statement_periods
  FOR EACH ROW
  EXECUTE FUNCTION update_statement_updated_at();

DROP TRIGGER IF EXISTS update_account_balances_updated_at ON customer_account_balances;
CREATE TRIGGER update_account_balances_updated_at
  BEFORE UPDATE ON customer_account_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_statement_updated_at();

DROP TRIGGER IF EXISTS update_statement_settings_updated_at ON statement_settings;
CREATE TRIGGER update_statement_settings_updated_at
  BEFORE UPDATE ON statement_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_statement_updated_at();

-- Fixed function to calculate running balance
CREATE OR REPLACE FUNCTION calculate_running_balance()
RETURNS TRIGGER AS $$
DECLARE
  prev_balance DECIMAL(10,2) := 0;
BEGIN
  -- Get the previous balance for this customer up to this transaction date
  SELECT COALESCE(running_balance, 0) INTO prev_balance
  FROM customer_statement_transactions
  WHERE customer_id = NEW.customer_id
    AND transaction_date <= NEW.transaction_date
    AND id != NEW.id
  ORDER BY transaction_date DESC, created_at DESC
  LIMIT 1;
  
  -- Only calculate if running_balance is not already set
  IF NEW.running_balance IS NULL THEN
    -- Calculate new running balance based on transaction type
    IF NEW.transaction_type IN ('charge') THEN
      NEW.running_balance := prev_balance + NEW.amount;
    ELSE -- payment, adjustment, credit
      NEW.running_balance := prev_balance - NEW.amount;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_transaction_running_balance ON customer_statement_transactions;
CREATE TRIGGER calculate_transaction_running_balance
  BEFORE INSERT OR UPDATE ON customer_statement_transactions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_running_balance();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS
ALTER TABLE customer_statement_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_statement_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_account_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE statement_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Statement Periods
CREATE POLICY "Users can view all statement periods" ON customer_statement_periods
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert statement periods" ON customer_statement_periods
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update statement periods" ON customer_statement_periods
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- RLS Policies for Transactions
CREATE POLICY "Users can view all statement transactions" ON customer_statement_transactions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert statement transactions" ON customer_statement_transactions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for Account Balances
CREATE POLICY "Users can view all account balances" ON customer_account_balances
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage account balances" ON customer_account_balances
  FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for Settings
CREATE POLICY "Users can view statement settings" ON statement_settings
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can update statement settings" ON statement_settings
  FOR ALL USING (auth.uid() IS NOT NULL);

-- =====================================================
-- INITIAL SETTINGS ONLY (NO SAMPLE DATA)
-- =====================================================

-- Insert default statement settings only
INSERT INTO statement_settings (
  auto_generate_monthly,
  statement_due_days,
  company_address,
  company_phone,
  company_email,
  payment_instructions
) VALUES (
  TRUE,
  30,
  'Jay Kay Digital Press\\n123 Business Street\\nYour City, State 12345',
  '(555) 123-4567',
  'billing@jaykaydp.com',
  'Payment is due within 30 days of statement date. Please include your account number with payment.'
) ON CONFLICT DO NOTHING;

-- Create account balances for existing customers (with zero balances)
INSERT INTO customer_account_balances (customer_id, current_balance, credit_limit)
SELECT 
  id as customer_id,
  0 as current_balance,
  1000 as credit_limit
FROM customers
ON CONFLICT (customer_id) DO NOTHING;
    `;

    console.log(createTablesSQL);
    console.log("\n✅ Copy and paste the above SQL into Supabase SQL Editor");
    console.log("📍 Instructions:");
    console.log("   1. Go to Supabase Dashboard → SQL Editor");
    console.log("   2. Paste the SQL above");
    console.log('   3. Click "Run" to execute');
    console.log("   4. Verify table creation was successful");

    console.log("\n🎯 Tables Created:");
    console.log(
      "   • customer_statement_periods - Monthly/quarterly statement periods",
    );
    console.log(
      "   • customer_statement_transactions - Individual transaction line items",
    );
    console.log(
      "   • customer_account_balances - Current customer balances and credit limits",
    );
    console.log(
      "   • statement_settings - Company info and statement formatting",
    );

    console.log("\n🔧 Production Features:");
    console.log("   • NO sample data (preserves existing real data)");
    console.log("   • Fixed running balance calculation trigger");
    console.log("   • Account balances initialized for existing customers");
    console.log("   • Default company settings only");
    console.log("   • Row-level security enabled");
  } catch (error) {
    console.error("❌ Migration preparation failed:", error);
  }
}

createCustomerStatementsSchema();
