import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

async function comprehensiveTest() {
  console.log('Comprehensive database access test...');
  
  // Test 1: Service role client
  console.log('\n1. Testing service role client...');
  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Test access to appUsers (this works)
  try {
    const { data, error } = await serviceSupabase
      .from('appUsers')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ appUsers access failed:', error.message);
    } else {
      console.log('✅ appUsers access successful');
    }
  } catch (err) {
    console.log('❌ appUsers access failed with exception:', err.message);
  }
  
  // Test access to customers (this should work with service role)
  try {
    const { data, error } = await serviceSupabase
      .from('customers')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ customers access failed:', error.message);
    } else {
      console.log('✅ customers access successful');
    }
  } catch (err) {
    console.log('❌ customers access failed with exception:', err.message);
  }
  
  // Test access to statement periods
  try {
    const { data, error } = await serviceSupabase
      .from('customer_statement_periods')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ statement periods access failed:', error.message);
    } else {
      console.log('✅ statement periods access successful');
    }
  } catch (err) {
    console.log('❌ statement periods access failed with exception:', err.message);
  }
  
  // Test 2: Regular user client
  console.log('\n2. Testing regular user client...');
  const regularSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  );
  
  // Test access to appUsers
  try {
    const { data, error } = await regularSupabase
      .from('appUsers')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ appUsers access failed:', error.message);
    } else {
      console.log('✅ appUsers access successful');
    }
  } catch (err) {
    console.log('❌ appUsers access failed with exception:', err.message);
  }
  
  // Test access to customers
  try {
    const { data, error } = await regularSupabase
      .from('customers')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ customers access failed:', error.message);
    } else {
      console.log('✅ customers access successful');
    }
  } catch (err) {
    console.log('❌ customers access failed with exception:', err.message);
  }
  
  // Test access to statement periods
  try {
    const { data, error } = await regularSupabase
      .from('customer_statement_periods')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ statement periods access failed:', error.message);
    } else {
      console.log('✅ statement periods access successful');
    }
  } catch (err) {
    console.log('❌ statement periods access failed with exception:', err.message);
  }
}

comprehensiveTest();