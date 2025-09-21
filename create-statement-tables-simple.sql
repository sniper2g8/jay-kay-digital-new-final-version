-- Create statement tables if they don't exist
-- This is a simplified version focusing just on table creation

-- 1. Customer Statement Periods (Monthly/Quarterly statements)
CREATE TABLE IF NOT EXISTS customer_statement_periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  statement_number VARCHAR(50) UNIQUE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  statement_date DATE DEFAULT CURRENT_DATE,
  opening_balance DECIMAL(10,2) DEFAULT 0,
  closing_balance DECIMAL(10,2) DEFAULT 0,
  current_balance DECIMAL(10,2) DEFAULT 0,
  total_charges DECIMAL(10,2) DEFAULT 0,
  total_payments DECIMAL(10,2) DEFAULT 0,
  total_adjustments DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'sent', 'viewed', 'paid')),
  is_current_period BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID,
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  UNIQUE(customer_id, period_start, period_end)
);

-- 2. Customer Statement Transactions (Individual line items)
CREATE TABLE IF NOT EXISTS customer_statement_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  statement_period_id UUID REFERENCES customer_statement_periods(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('charge', 'payment', 'adjustment', 'credit')),
  description TEXT,
  reference_number VARCHAR(50),
  amount DECIMAL(10,2) NOT NULL,
  running_balance DECIMAL(10,2) NOT NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Customer Account Balances (Current balances and credit info)
CREATE TABLE IF NOT EXISTS customer_account_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
  current_balance DECIMAL(10,2) DEFAULT 0,
  outstanding_invoices DECIMAL(10,2) DEFAULT 0,
  credits_available DECIMAL(10,2) DEFAULT 0,
  credit_limit DECIMAL(10,2) DEFAULT 0,
  credit_used DECIMAL(10,2) DEFAULT 0,
  payment_terms_days INTEGER DEFAULT 30,
  last_transaction_date DATE,
  last_payment_date DATE,
  last_statement_date DATE,
  account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Statement Settings (Company info and formatting)
CREATE TABLE IF NOT EXISTS statement_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auto_generate_monthly BOOLEAN DEFAULT FALSE,
  statement_due_days INTEGER DEFAULT 30,
  company_logo_url TEXT,
  company_address TEXT,
  company_phone VARCHAR(20),
  company_email VARCHAR(255),
  header_text TEXT DEFAULT 'Account Statement',
  footer_text TEXT DEFAULT 'Thank you for your business!',
  payment_instructions TEXT,
  currency_symbol VARCHAR(5) DEFAULT '$',
  date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);