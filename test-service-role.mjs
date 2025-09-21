import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

async function testServiceRole() {
  console.log('Testing service role access...');
  
  // Create Supabase client with service role key
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Test a simple query
  try {
    const { data, error } = await supabase
      .from('appUsers')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Service role test failed:', error.message);
      return;
    }
    
    console.log('✅ Service role test passed');
    console.log('Found', data.length, 'user(s)');
  } catch (err) {
    console.log('❌ Service role test failed with exception:', err.message);
  }
  
  // Test statement periods access
  console.log('\nTesting statement periods access...');
  try {
    const { data, error } = await supabase
      .from('customer_statement_periods')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Statement periods access failed:', error.message);
      return;
    }
    
    console.log('✅ Statement periods access passed');
    console.log('Found', data.length, 'period(s)');
  } catch (err) {
    console.log('❌ Statement periods access failed with exception:', err.message);
  }
}

testServiceRole();