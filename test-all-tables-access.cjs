// Test script to verify access to all tables after applying RLS policies
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

async function testAllTablesAccess() {
  console.log('Testing access to all tables...\n');
  
  // List of tables to test
  const tables = [
    'appUsers',
    'customers',
    'jobs',
    'invoices',
    'payments',
    'notifications',
    'notification_preferences'
  ];
  
  // Also test statement tables if they exist
  const statementTables = [
    'customer_statement_periods',
    'customer_statement_transactions',
    'customer_account_balances',
    'statement_settings'
  ];
  
  // Test core business tables
  console.log('1. Testing core business tables...');
  for (const table of tables) {
    try {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: Accessible`);
      }
    } catch (error) {
      console.log(`❌ ${table}: ${error.message}`);
    }
  }
  
  // Test statement tables
  console.log('\n2. Testing statement tables...');
  for (const table of statementTables) {
    try {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) {
        // Check if it's a "not found" error (table doesn't exist)
        if (error.code === '42P01') {
          console.log(`⚠️  ${table}: Table does not exist (not created yet)`);
        } else {
          console.log(`❌ ${table}: ${error.message}`);
        }
      } else {
        console.log(`✅ ${table}: Accessible`);
      }
    } catch (error) {
      console.log(`❌ ${table}: ${error.message}`);
    }
  }
  
  console.log('\n📋 Summary:');
  console.log('   - Core business tables should all be accessible');
  console.log('   - Statement tables may not exist yet (will be created when needed)');
  console.log('   - If any core tables show permission errors, RLS policies need to be applied');
  
  console.log('\n🔧 Next steps:');
  console.log('   1. If you see permission errors, apply the RLS policies from complete-rls-fix.sql');
  console.log('   2. If statement tables show "not found", create them using create-and-fix-statement-tables.sql');
  console.log('   3. Test the statement periods feature again');
}

testAllTablesAccess();