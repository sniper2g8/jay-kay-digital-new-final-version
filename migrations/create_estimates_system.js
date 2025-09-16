const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pnoxqzlxfuvjvufdjuqh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBub3hxemx4ZnV2anZ1ZmRqdXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczOTMxMzMsImV4cCI6MjA3Mjk2OTEzM30.QG0B60xV9TO2PaUeEOkzgqXcVuSkHVq3yYfXWKaaDzc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createEstimatesTable() {
  console.log('🏗️  Creating Customer Estimates Management System');
  console.log('================================================\n');
  
  try {
    console.log('📋 Step 1: Planning estimates table structure...');
    
    const estimatesTableSQL = `
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
    `;

    console.log('✅ Estimates table structure planned');
    
    console.log('\n📊 Step 2: Planning estimate workflow...');
    console.log('Estimate Lifecycle:');
    console.log('  1. draft → created by staff, not yet sent');
    console.log('  2. sent → sent to customer for review');
    console.log('  3. viewed → customer has viewed the estimate');
    console.log('  4. approved → customer approved the estimate');
    console.log('  5. rejected → customer rejected the estimate');
    console.log('  6. expired → estimate expired without response');
    console.log('  7. converted → approved estimate converted to job');
    
    console.log('\n🎯 Step 3: Features to implement...');
    console.log('✅ Planned Features:');
    console.log('  - Estimate creation and management');
    console.log('  - Customer estimate viewing portal');
    console.log('  - Estimate approval/rejection workflow');
    console.log('  - Version control for estimate revisions');
    console.log('  - Automatic job conversion from approved estimates');
    console.log('  - Email notifications for estimate updates');
    console.log('  - PDF estimate generation');
    console.log('  - Estimate expiration handling');
    
    console.log('\n🚀 Ready to implement customer estimates system!');
    console.log('Next steps:');
    console.log('  1. Create estimates table in database');
    console.log('  2. Build estimate creation interface');
    console.log('  3. Create customer estimate viewing portal');
    console.log('  4. Implement approval/rejection workflow');

  } catch (error) {
    console.error('❌ Planning failed:', error);
  }
}

createEstimatesTable();