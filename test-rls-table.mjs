import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

async function testRLSTable() {
  console.log('Testing RLS test table...');
  
  // Service role client
  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Regular user client
  const regularSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  );
  
  // Test service role access
  try {
    const { data, error } = await serviceSupabase
      .from('rls_test')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Service role access failed:', error.message);
    } else {
      console.log('✅ Service role access successful');
    }
  } catch (err) {
    console.log('❌ Service role access failed with exception:', err.message);
  }
  
  // Test regular user access
  try {
    const { data, error } = await regularSupabase
      .from('rls_test')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Regular user access failed:', error.message);
    } else {
      console.log('✅ Regular user access successful');
    }
  } catch (err) {
    console.log('❌ Regular user access failed with exception:', err.message);
  }
}

testRLSTable();