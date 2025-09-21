// Test script to verify statement periods access
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

async function testStatementPeriodsAccess() {
  console.log('Testing statement periods access...');
  
  try {
    // 1. Check if tables exist by trying to access them with service role
    console.log('\n1. Testing service role access to statement periods table...');
    const { data: periods, error: periodsError } = await supabaseAdmin
      .from('customer_statement_periods')
      .select('id')
      .limit(1);
    
    if (periodsError) {
      console.error('Service role access failed:', {
        message: periodsError.message,
        code: periodsError.code
      });
      
      // If it's a "not found" error, the table might not exist
      if (periodsError.code === '42P01') {
        console.log('Table customer_statement_periods does not exist');
        console.log('Please run the migration script to create tables');
        return;
      }
      
      return;
    }
    
    console.log('✅ Service role access successful');
    console.log('   Found', periods?.length || 0, 'statement periods');
    
    // 2. Check if we can access statement transactions
    console.log('\n2. Testing service role access to statement transactions table...');
    const { data: transactions, error: transactionsError } = await supabaseAdmin
      .from('customer_statement_transactions')
      .select('id')
      .limit(1);
    
    if (transactionsError) {
      console.error('Service role access to transactions failed:', {
        message: transactionsError.message,
        code: transactionsError.code
      });
      return;
    }
    
    console.log('✅ Service role access to transactions successful');
    console.log('   Found', transactions?.length || 0, 'transactions');
    
    // 3. Check if we can access account balances
    console.log('\n3. Testing service role access to account balances table...');
    const { data: balances, error: balancesError } = await supabaseAdmin
      .from('customer_account_balances')
      .select('id')
      .limit(1);
    
    if (balancesError) {
      console.error('Service role access to balances failed:', {
        message: balancesError.message,
        code: balancesError.code
      });
      return;
    }
    
    console.log('✅ Service role access to balances successful');
    console.log('   Found', balances?.length || 0, 'account balances');
    
    console.log('\n🎉 All statement tables are accessible with service role!');
    console.log('   Next steps:');
    console.log('   1. Apply the RLS policies from fix-statement-rls-policies.sql');
    console.log('   2. Test user access with authenticated clients');
    
  } catch (error) {
    console.error('Unexpected error in statement periods access test:', error);
  }
}

testStatementPeriodsAccess();