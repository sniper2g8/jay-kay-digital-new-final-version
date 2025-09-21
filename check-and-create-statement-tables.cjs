// Script to check if statement tables exist and create them if they don't
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Create service role client for admin access
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// SQL to create statement tables
const createTablesSQL = `
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

-- Function to calculate running balance for transactions
CREATE OR REPLACE FUNCTION calculate_transaction_running_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- This would be implemented with more complex logic in a real application
  -- For now, we'll just ensure the running balance is set
  IF NEW.running_balance IS NULL THEN
    NEW.running_balance = NEW.amount;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for transaction running balance calculation
DROP TRIGGER IF EXISTS calculate_transaction_running_balance ON customer_statement_transactions;
-- CREATE TRIGGER calculate_transaction_running_balance 
--     BEFORE INSERT OR UPDATE ON customer_statement_transactions 
--     FOR EACH ROW 
--     EXECUTE FUNCTION calculate_transaction_running_balance();

-- Function to update statement period totals when transactions change
CREATE OR REPLACE FUNCTION update_statement_period_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- This would recalculate totals for the statement period
  -- Implementation would depend on specific business logic
  RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- RLS POLICIES (Will be applied separately)
-- =====================================================

-- Enable RLS (will be done in separate script)
-- ALTER TABLE customer_statement_periods ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE customer_statement_transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE customer_account_balances ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE statement_settings ENABLE ROW LEVEL SECURITY;
`;

async function checkAndCreateStatementTables() {
  console.log('Checking and creating statement tables...');
  
  try {
    // First, let's try to check if the tables exist by attempting a simple query
    console.log('\n1. Checking if customer_statement_periods table exists...');
    const { data, error } = await supabaseAdmin
      .from('customer_statement_periods')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log('❌ Table customer_statement_periods does not exist');
      console.log('   Creating all statement tables...');
      
      // Execute the create tables SQL
      console.log('\n2. Creating statement tables...');
      const { error: createError } = await supabaseAdmin.rpc('exec_sql', { sql: createTablesSQL });
      
      if (createError) {
        console.error('❌ Error creating tables:', createError);
        return;
      }
      
      console.log('✅ Statement tables created successfully!');
    } else if (error) {
      console.error('❌ Error checking table existence:', error);
      return;
    } else {
      console.log('✅ Table customer_statement_periods already exists');
      console.log('   Found', data?.length || 0, 'existing records');
    }
    
    // Test access to all tables
    console.log('\n3. Testing access to all statement tables...');
    
    const tables = [
      'customer_statement_periods',
      'customer_statement_transactions',
      'customer_account_balances',
      'statement_settings'
    ];
    
    for (const table of tables) {
      try {
        const { data: testData, error: testError } = await supabaseAdmin
          .from(table)
          .select('id')
          .limit(1);
        
        if (testError) {
          console.error(`❌ Error accessing ${table}:`, testError.message);
        } else {
          console.log(`✅ ${table} accessible`);
        }
      } catch (tableError) {
        console.error(`❌ Unexpected error with ${table}:`, tableError);
      }
    }
    
    console.log('\n📋 Next steps:');
    console.log('   1. Apply RLS policies using fix-statement-rls-policies.sql');
    console.log('   2. Add initial data if needed');
    console.log('   3. Test user access');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkAndCreateStatementTables();