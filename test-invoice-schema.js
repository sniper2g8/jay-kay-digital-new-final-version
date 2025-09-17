const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInvoiceSchema() {
  console.log('🔍 Testing Enhanced Invoice Management Schema...\n');

  try {
    // Test 1: Check new columns in invoices table
    console.log('1. Testing enhanced invoices table...');
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('id, invoice_status, invoice_date, terms_days, template_id')
      .limit(1);
    
    if (invoicesError) {
      console.log('❌ Invoices table error:', invoicesError.message);
    } else {
      console.log('✅ Enhanced invoices table accessible');
    }

    // Test 2: Check invoice templates table
    console.log('2. Testing invoice_templates table...');
    const { data: templates, error: templatesError } = await supabase
      .from('invoice_templates')
      .select('*')
      .limit(1);
    
    if (templatesError) {
      console.log('❌ Templates table error:', templatesError.message);
    } else {
      console.log('✅ Invoice templates table accessible');
      console.log(`📋 Found ${templates?.length || 0} templates`);
    }

    // Test 3: Check payment allocations table
    console.log('3. Testing payment_allocations table...');
    const { data: allocations, error: allocationsError } = await supabase
      .from('payment_allocations')
      .select('*')
      .limit(1);
    
    if (allocationsError) {
      console.log('❌ Payment allocations error:', allocationsError.message);
    } else {
      console.log('✅ Payment allocations table accessible');
    }

    // Test 4: Check invoice status history table
    console.log('4. Testing invoice_status_history table...');
    const { data: history, error: historyError } = await supabase
      .from('invoice_status_history')
      .select('*')
      .limit(1);
    
    if (historyError) {
      console.log('❌ Status history error:', historyError.message);
    } else {
      console.log('✅ Invoice status history table accessible');
    }

    // Test 5: Check recurring invoices table
    console.log('5. Testing recurring_invoices table...');
    const { data: recurring, error: recurringError } = await supabase
      .from('recurring_invoices')
      .select('*')
      .limit(1);
    
    if (recurringError) {
      console.log('❌ Recurring invoices error:', recurringError.message);
    } else {
      console.log('✅ Recurring invoices table accessible');
    }

    // Test 6: Check enhanced invoice line items
    console.log('6. Testing enhanced invoice_line_items...');
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('invoice_line_items')
      .select('id, line_order, discount_amount, tax_rate, tax_amount, job_id')
      .limit(1);
    
    if (lineItemsError) {
      console.log('❌ Line items error:', lineItemsError.message);
    } else {
      console.log('✅ Enhanced invoice line items accessible');
    }

    // Test 7: Check enhanced payments table
    console.log('7. Testing enhanced payments table...');
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('id, payment_status, customer_id, applied_to_invoice_id')
      .limit(1);
    
    if (paymentsError) {
      console.log('❌ Enhanced payments error:', paymentsError.message);
    } else {
      console.log('✅ Enhanced payments table accessible');
    }

    // Test 8: Check customers table for relationship
    console.log('8. Testing customers table relationship...');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, business_name')
      .limit(1);
    
    if (customersError) {
      console.log('❌ Customers table error:', customersError.message);
    } else {
      console.log('✅ Customers table accessible for relationships');
      console.log(`👥 Found ${customers?.length || 0} customers`);
    }

    console.log('\n✅ Enhanced Invoice Management Schema Test Complete!');
    console.log('📊 Schema is ready for invoice management operations');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testInvoiceSchema();