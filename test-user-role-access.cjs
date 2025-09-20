// Test user role access policies
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testUserRoleAccess() {
  console.log('Testing user role access policies...');
  
  try {
    // Test 1: Service role access (should work)
    console.log('\n1. Testing service role access...');
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data: serviceData, error: serviceError } = await supabaseService
      .from('appUsers')
      .select('id, email, name, primary_role, human_id, status')
      .eq('id', '337eb073-1bfd-4879-94b7-653bda239e06');
    
    if (serviceError) {
      console.error('❌ Service role access failed:', serviceError.message);
    } else {
      console.log('✅ Service role access successful');
      console.log('   User:', serviceData[0]?.name || 'Unknown');
      console.log('   Role:', serviceData[0]?.primary_role || 'Unknown');
    }
    
    // Test 2: Regular authenticated user access (testing RLS policies)
    console.log('\n2. Testing regular user access...');
    const supabaseRegular = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    );
    
    // Try to access own record (should work with current policies)
    const { data: regularData, error: regularError } = await supabaseRegular
      .from('appUsers')
      .select('id, email, name, primary_role, human_id, status')
      .eq('id', '337eb073-1bfd-4879-94b7-653bda239e06');
    
    if (regularError) {
      console.error('❌ Regular user access failed:', regularError.message);
      console.error('   Error code:', regularError.code);
    } else {
      console.log('✅ Regular user access successful');
      console.log('   Found', regularData.length, 'records');
    }
    
    // Test 3: Try to access a different user's record (should be restricted)
    console.log('\n3. Testing access to different user record...');
    const { data: otherData, error: otherError } = await supabaseRegular
      .from('appUsers')
      .select('id, email, name, primary_role, human_id, status')
      .neq('id', '337eb073-1bfd-4879-94b7-653bda239e06')
      .limit(1);
    
    if (otherError) {
      console.error('❌ Access to other user failed:', otherError.message);
    } else {
      console.log('✅ Access to other user records:', otherData.length > 0 ? 'Allowed' : 'Restricted');
    }
    
  } catch (error) {
    console.error('Exception occurred:', error.message);
  }
}

testUserRoleAccess();