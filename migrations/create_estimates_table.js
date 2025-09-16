const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pnoxqzlxfuvjvufdjuqh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBub3hxemx4ZnV2anZ1ZmRqdXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczOTMxMzMsImV4cCI6MjA3Mjk2OTEzM30.QG0B60xV9TO2PaUeEOkzgqXcVuSkHVq3yYfXWKaaDzc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createEstimatesTable() {
  console.log('🏗️  Creating Customer Estimates Table');
  console.log('====================================\n');
  
  try {
    console.log('📋 Step 1: Creating customer_estimates table...');
    
    // Note: Since we're using the client library with anon key, we can't execute DDL
    // This would need to be done via SQL editor in Supabase dashboard or with service role key
    
    console.log('⚠️  Table creation needs to be done via Supabase SQL Editor');
    console.log('\n📝 SQL to execute in Supabase Dashboard:');
    console.log('=====================================');
    
    const createTableSQL = `
-- Create customer_estimates table
CREATE TABLE IF NOT EXISTS customer_estimates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_number VARCHAR(50) UNIQUE NOT NULL, -- JKDP-EST-XXXX format
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  
  -- Estimate Details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  specifications JSONB,
  
  -- Pricing
  unit_price DECIMAL(10,2),
  quantity INTEGER DEFAULT 1,
  subtotal DECIMAL(10,2),
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Status & Workflow
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'approved', 'rejected', 'expired', 'converted')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Dates
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Approval/Conversion
  customer_response TEXT, -- Customer comments/feedback
  approved_by VARCHAR(255),
  converted_to_job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  
  -- Metadata
  created_by UUID, -- staff member who created
  version INTEGER DEFAULT 1,
  is_current_version BOOLEAN DEFAULT TRUE,
  parent_estimate_id UUID REFERENCES customer_estimates(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_estimates_customer_id ON customer_estimates(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_estimates_status ON customer_estimates(status);
CREATE INDEX IF NOT EXISTS idx_customer_estimates_estimate_number ON customer_estimates(estimate_number);
CREATE INDEX IF NOT EXISTS idx_customer_estimates_created_at ON customer_estimates(created_at);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_customer_estimates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_customer_estimates_updated_at ON customer_estimates;
CREATE TRIGGER update_customer_estimates_updated_at
  BEFORE UPDATE ON customer_estimates
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_estimates_updated_at();

-- Enable RLS
ALTER TABLE customer_estimates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all estimates" ON customer_estimates
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert estimates" ON customer_estimates
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update estimates" ON customer_estimates
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Insert sample data
INSERT INTO customer_estimates (
  estimate_number,
  customer_id,
  customer_name,
  title,
  description,
  unit_price,
  quantity,
  subtotal,
  total_amount,
  status,
  priority
) VALUES 
(
  'JKDP-EST-0001',
  (SELECT id FROM customers LIMIT 1),
  'Sample Customer',
  'Business Card Printing',
  'Premium business cards with matte finish',
  2.50,
  500,
  1250.00,
  1250.00,
  'draft',
  'medium'
),
(
  'JKDP-EST-0002',
  (SELECT id FROM customers LIMIT 1),
  'Sample Customer',
  'Brochure Design & Print',
  'Tri-fold brochures with full color printing',
  5.00,
  200,
  1000.00,
  1000.00,
  'sent',
  'high'
);
    `;
    
    console.log(createTableSQL);
    console.log('\n✅ Copy and paste the above SQL into Supabase SQL Editor');
    console.log('📍 Instructions:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Paste the SQL above');
    console.log('   3. Click "Run" to execute');
    console.log('   4. Verify table creation was successful');
    
    console.log('\n🎯 After table creation, the estimates system will be fully functional!');

  } catch (error) {
    console.error('❌ Migration preparation failed:', error);
  }
}

createEstimatesTable();