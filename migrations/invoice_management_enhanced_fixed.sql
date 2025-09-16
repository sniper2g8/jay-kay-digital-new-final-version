-- =====================================================
-- ENHANCED INVOICE MANAGEMENT SYSTEM - Database Schema (FIXED)
-- =====================================================
-- Execute this script in Supabase SQL Editor AFTER customer_statements_production.sql
-- This enhances existing invoice/payment tables and adds missing functionality
-- Integrates with customer statements system for complete financial tracking
-- FIXED: Corrected table name references (appUsers -> "appUsers")
-- =====================================================

-- =====================================================
-- 1. ENHANCE EXISTING INVOICE TABLE
-- =====================================================

-- Add missing columns to existing invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS invoice_status VARCHAR(20) DEFAULT 'draft' CHECK (invoice_status IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled')),
ADD COLUMN IF NOT EXISTS invoice_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS terms_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS late_fee_percentage DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS pdf_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS generated_by UUID REFERENCES "appUsers"(id),
ADD COLUMN IF NOT EXISTS template_id UUID;

-- =====================================================
-- 2. FIX INVOICE LINE ITEMS TABLE PERMISSIONS
-- =====================================================

-- Enable RLS on invoice_line_items (currently has permission issues)
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;

-- Create proper RLS policies for invoice_line_items
CREATE POLICY "Users can view all invoice line items" ON invoice_line_items
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage invoice line items" ON invoice_line_items
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Add missing columns to invoice_line_items
ALTER TABLE invoice_line_items 
ADD COLUMN IF NOT EXISTS line_order INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id) ON DELETE SET NULL;

-- =====================================================
-- 3. ENHANCE PAYMENTS TABLE
-- =====================================================

-- Add missing columns to payments table for better tracking
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(50),
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id),
ADD COLUMN IF NOT EXISTS applied_to_invoice_id UUID REFERENCES invoices(id),
ADD COLUMN IF NOT EXISTS overpayment_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS fees DECIMAL(10,2) DEFAULT 0;

-- =====================================================
-- 4. NEW TABLES FOR ENHANCED FUNCTIONALITY
-- =====================================================

-- Invoice Templates
CREATE TABLE IF NOT EXISTS invoice_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Template Details
  template_name VARCHAR(100) NOT NULL,
  template_type VARCHAR(20) DEFAULT 'standard' CHECK (template_type IN ('standard', 'service', 'product', 'custom')),
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Template Content
  header_html TEXT,
  footer_html TEXT,
  terms_conditions TEXT,
  payment_instructions TEXT,
  
  -- Styling
  primary_color VARCHAR(7) DEFAULT '#000000',
  secondary_color VARCHAR(7) DEFAULT '#666666',
  logo_url TEXT,
  font_family VARCHAR(50) DEFAULT 'Arial',
  
  -- Settings
  show_line_numbers BOOLEAN DEFAULT TRUE,
  show_tax_breakdown BOOLEAN DEFAULT TRUE,
  show_payment_terms BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES "appUsers"(id)
);

-- Payment Allocations (for partial payments across multiple invoices)
CREATE TABLE IF NOT EXISTS payment_allocations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- References
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Allocation Details
  allocated_amount DECIMAL(10,2) NOT NULL,
  allocation_date TIMESTAMPTZ DEFAULT NOW(),
  allocation_type VARCHAR(20) DEFAULT 'payment' CHECK (allocation_type IN ('payment', 'credit', 'adjustment')),
  
  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES "appUsers"(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice Status History (audit trail)
CREATE TABLE IF NOT EXISTS invoice_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- References
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Status Change
  status_from VARCHAR(20),
  status_to VARCHAR(20) NOT NULL,
  change_date TIMESTAMPTZ DEFAULT NOW(),
  
  -- Context
  changed_by UUID REFERENCES "appUsers"(id),
  reason TEXT,
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recurring Invoice Settings
CREATE TABLE IF NOT EXISTS recurring_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Base Invoice
  template_invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Recurrence Settings
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  interval_count INTEGER DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE,
  next_generation_date DATE NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  total_generated INTEGER DEFAULT 0,
  max_occurrences INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES "appUsers"(id)
);

-- =====================================================
-- 5. INDEXES FOR PERFORMANCE
-- =====================================================

-- Enhanced Invoice Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(invoice_status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_status ON invoices(customer_id, invoice_status);

-- Payment Indexes
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(applied_to_invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

-- New Table Indexes
CREATE INDEX IF NOT EXISTS idx_payment_allocations_payment ON payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_invoice ON payment_allocations(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_status_history_invoice ON invoice_status_history(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_status_history_date ON invoice_status_history(change_date);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_next_date ON recurring_invoices(next_generation_date);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_active ON recurring_invoices(is_active) WHERE is_active = TRUE;

-- =====================================================
-- 6. TRIGGERS AND FUNCTIONS
-- =====================================================

-- Update timestamp triggers for new tables
CREATE OR REPLACE FUNCTION update_invoice_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers
DROP TRIGGER IF EXISTS update_invoice_templates_updated_at ON invoice_templates;
CREATE TRIGGER update_invoice_templates_updated_at
  BEFORE UPDATE ON invoice_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_updated_at();

DROP TRIGGER IF EXISTS update_recurring_invoices_updated_at ON recurring_invoices;
CREATE TRIGGER update_recurring_invoices_updated_at
  BEFORE UPDATE ON recurring_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_updated_at();

-- Auto-create invoice status history entries
CREATE OR REPLACE FUNCTION track_invoice_status_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create history entry if status actually changed
  IF OLD.invoice_status IS DISTINCT FROM NEW.invoice_status THEN
    INSERT INTO invoice_status_history (
      invoice_id,
      status_from,
      status_to,
      changed_by,
      reason
    ) VALUES (
      NEW.id,
      OLD.invoice_status,
      NEW.invoice_status,
      NEW.generated_by,
      'Status updated'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS track_invoice_status_changes_trigger ON invoices;
CREATE TRIGGER track_invoice_status_changes_trigger
  AFTER UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION track_invoice_status_changes();

-- Auto-calculate invoice totals when line items change
CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
  invoice_subtotal DECIMAL(10,2) := 0;
  invoice_tax_total DECIMAL(10,2) := 0;
  invoice_discount_total DECIMAL(10,2) := 0;
  invoice_grand_total DECIMAL(10,2) := 0;
BEGIN
  -- Calculate totals from line items
  SELECT 
    COALESCE(SUM(total_price), 0),
    COALESCE(SUM(tax_amount), 0),
    COALESCE(SUM(discount_amount), 0)
  INTO 
    invoice_subtotal,
    invoice_tax_total,
    invoice_discount_total
  FROM invoice_line_items 
  WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Calculate grand total
  invoice_grand_total := invoice_subtotal + invoice_tax_total - invoice_discount_total;
  
  -- Update the invoice
  UPDATE invoices SET
    subtotal = invoice_subtotal,
    tax = invoice_tax_total,
    discount = invoice_discount_total,
    total = invoice_grand_total,
    grandTotal = invoice_grand_total,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_invoice_totals_trigger ON invoice_line_items;
CREATE TRIGGER update_invoice_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON invoice_line_items
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_totals();

-- Auto-update payment status when payments are allocated
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  total_allocated DECIMAL(10,2) := 0;
  invoice_total DECIMAL(10,2) := 0;
  new_status VARCHAR(20);
BEGIN
  -- Get total allocated amount for this invoice
  SELECT COALESCE(SUM(allocated_amount), 0) INTO total_allocated
  FROM payment_allocations 
  WHERE invoice_id = NEW.invoice_id;
  
  -- Get invoice total
  SELECT COALESCE(total, grandTotal, 0) INTO invoice_total
  FROM invoices 
  WHERE id = NEW.invoice_id;
  
  -- Determine new payment status
  IF total_allocated >= invoice_total THEN
    new_status := 'paid';
  ELSIF total_allocated > 0 THEN
    new_status := 'partial';
  ELSE
    new_status := 'pending';
  END IF;
  
  -- Update invoice payment status
  UPDATE invoices SET
    payment_status = new_status::payment_status,
    amountPaid = total_allocated,
    amountDue = invoice_total - total_allocated,
    updated_at = NOW()
  WHERE id = NEW.invoice_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_invoice_payment_status_trigger ON payment_allocations;
CREATE TRIGGER update_invoice_payment_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON payment_allocations
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_payment_status();

-- =====================================================
-- 7. ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Invoice Templates
CREATE POLICY "Users can view all invoice templates" ON invoice_templates
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage invoice templates" ON invoice_templates
  FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for Payment Allocations
CREATE POLICY "Users can view all payment allocations" ON payment_allocations
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage payment allocations" ON payment_allocations
  FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for Invoice Status History
CREATE POLICY "Users can view invoice status history" ON invoice_status_history
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert invoice status history" ON invoice_status_history
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for Recurring Invoices
CREATE POLICY "Users can view all recurring invoices" ON recurring_invoices
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage recurring invoices" ON recurring_invoices
  FOR ALL USING (auth.uid() IS NOT NULL);

-- =====================================================
-- 8. INTEGRATION WITH CUSTOMER STATEMENTS
-- =====================================================

-- Function to create statement transactions from invoices
CREATE OR REPLACE FUNCTION create_statement_transaction_from_invoice()
RETURNS TRIGGER AS $$
DECLARE
  current_period_id UUID;
BEGIN
  -- Only create statement transaction for finalized invoices
  IF NEW.invoice_status IN ('sent', 'paid') AND (OLD.invoice_status IS NULL OR OLD.invoice_status != NEW.invoice_status) THEN
    
    -- Find current statement period for customer
    SELECT id INTO current_period_id
    FROM customer_statement_periods
    WHERE customer_id = NEW.customer_id
      AND is_current_period = TRUE
      AND period_start <= NEW.invoice_date
      AND period_end >= NEW.invoice_date
    LIMIT 1;
    
    -- Create statement transaction if period exists
    IF current_period_id IS NOT NULL THEN
      INSERT INTO customer_statement_transactions (
        statement_period_id,
        customer_id,
        transaction_date,
        transaction_type,
        description,
        reference_number,
        amount,
        invoice_id,
        created_by
      ) VALUES (
        current_period_id,
        NEW.customer_id,
        NEW.invoice_date,
        'charge',
        'Invoice #' || COALESCE(NEW.invoiceNo, NEW.id::text),
        NEW.invoiceNo,
        COALESCE(NEW.total, NEW.grandTotal, 0),
        NEW.id,
        NEW.generated_by
      ) ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_statement_transaction_from_invoice_trigger ON invoices;
CREATE TRIGGER create_statement_transaction_from_invoice_trigger
  AFTER INSERT OR UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION create_statement_transaction_from_invoice();

-- Function to create statement transactions from payments
CREATE OR REPLACE FUNCTION create_statement_transaction_from_payment()
RETURNS TRIGGER AS $$
DECLARE
  current_period_id UUID;
  customer_id_val UUID;
BEGIN
  -- Get customer ID from payment
  SELECT customer_id INTO customer_id_val FROM invoices WHERE id = NEW.applied_to_invoice_id;
  
  IF customer_id_val IS NULL THEN
    customer_id_val := NEW.customer_id;
  END IF;
  
  -- Only create statement transaction for completed payments
  IF NEW.payment_status = 'completed' THEN
    
    -- Find current statement period for customer
    SELECT id INTO current_period_id
    FROM customer_statement_periods
    WHERE customer_id = customer_id_val
      AND is_current_period = TRUE
      AND period_start <= NEW.payment_date
      AND period_end >= NEW.payment_date
    LIMIT 1;
    
    -- Create statement transaction if period exists
    IF current_period_id IS NOT NULL THEN
      INSERT INTO customer_statement_transactions (
        statement_period_id,
        customer_id,
        transaction_date,
        transaction_type,
        description,
        reference_number,
        amount,
        payment_id,
        created_by
      ) VALUES (
        current_period_id,
        customer_id_val,
        NEW.payment_date::date,
        'payment',
        'Payment #' || NEW.payment_number,
        NEW.payment_number,
        NEW.amount,
        NEW.id,
        NEW.received_by
      ) ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_statement_transaction_from_payment_trigger ON payments;
CREATE TRIGGER create_statement_transaction_from_payment_trigger
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION create_statement_transaction_from_payment();

-- =====================================================
-- 9. INITIAL DATA AND SETTINGS
-- =====================================================

-- Insert default invoice template
INSERT INTO invoice_templates (
  template_name,
  template_type,
  is_default,
  header_html,
  footer_html,
  terms_conditions,
  payment_instructions,
  primary_color,
  secondary_color
) VALUES (
  'Default Invoice Template',
  'standard',
  TRUE,
  '<div style="text-align: center; margin-bottom: 20px;">
    <h1 style="color: #000000; margin: 0;">Jay Kay Digital Press</h1>
    <p style="color: #666666; margin: 5px 0;">Professional Printing Services</p>
  </div>',
  '<div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
    <p style="color: #666666; font-size: 12px;">Thank you for your business!</p>
    <p style="color: #666666; font-size: 12px;">Questions? Contact us at billing@jaykaydp.com</p>
  </div>',
  'Payment is due within 30 days of invoice date. Late payments may incur additional fees.',
  'Please remit payment via bank transfer, cash, or approved payment methods. Include invoice number with payment.',
  '#000000',
  '#666666'
) ON CONFLICT DO NOTHING;

-- Update invoice line items to fix relationships
UPDATE invoice_line_items SET 
  total_price = COALESCE(quantity, 1) * COALESCE(unit_price, 0)
WHERE total_price IS NULL OR total_price = 0;

-- =====================================================
-- 10. VERIFICATION QUERIES
-- =====================================================

-- Uncomment to verify table creation and relationships:
-- SELECT 'Enhanced Tables Created:' as status;
-- SELECT 'invoice_templates' as table_name, count(*) as records FROM invoice_templates
-- UNION ALL
-- SELECT 'payment_allocations', count(*) FROM payment_allocations
-- UNION ALL
-- SELECT 'invoice_status_history', count(*) FROM invoice_status_history
-- UNION ALL
-- SELECT 'recurring_invoices', count(*) FROM recurring_invoices;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Enhanced existing tables: invoices, payments, invoice_line_items
-- New tables created: 4 (templates, allocations, history, recurring)
-- Triggers created: 6 (status tracking, totals calculation, statement integration)
-- Indexes created: 12 (performance optimization)
-- RLS Policies: 8 (security)
-- Customer Statements Integration: Complete
-- Ready for invoice management implementation
-- =====================================================