import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

// Create Supabase clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
);

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRLSFixes() {
  console.log('Testing RLS fixes...');
  
  // Test tables that were having permission issues
  const testTables = [
    'customers',
    'jobs',
    'invoices',
    'payments',
    'customer_statement_periods',
    'customer_statement_transactions',
    'customer_account_balances',
    'statement_settings'
  ];
  
  console.log('\n1. Testing with service role (should have access to all tables):');
  for (const table of testTables) {
    try {
      const { data, error } = await adminSupabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: Accessible`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
  
  console.log('\n2. Testing with regular user (should have limited access):');
  for (const table of testTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: Accessible`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
  
  console.log('\n3. Testing specific query that was failing in useStatementPeriods hook:');
  try {
    const { data, error } = await adminSupabase
      .from('customer_statement_periods')
      .select(`
        *,
        customer:customers(
          id,
          business_name,
          contact_person,
          email,
          phone
        )
      `)
      .order('period_start', { ascending: false });
    
    if (error) {
      console.log(`❌ Statement periods query failed: ${error.message}`);
    } else {
      console.log(`✅ Statement periods query successful: Found ${data.length} records`);
    }
  } catch (err) {
    console.log(`❌ Statement periods query failed: ${err.message}`);
  }
  
  console.log('\nTest completed.');
}

// Run the test
testRLSFixes();