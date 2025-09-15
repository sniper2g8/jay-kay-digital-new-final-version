const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pnoxqzlxfuvjvufdjuqh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBub3hxemx4ZnV2anZ1ZmRqdXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczOTMxMzMsImV4cCI6MjA3Mjk2OTEzM30.QG0B60xV9TO2PaUeEOkzgqXcVuSkHVq3yYfXWKaaDzc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthAfterCleanSlate() {
  console.log('🧪 Testing Auth After Clean Slate Fix\n');
  
  // Test 1: Try signup with better email format
  console.log('=== Test 1: Signup with Valid Email ===');
  const testEmail = `testuser${Date.now()}@gmail.com`; // Better email format
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!'
    });
    
    if (error) {
      console.log('❌ Signup failed:', error.message);
      console.log('Error status:', error.status);
      
      if (error.message.includes('Database error')) {
        console.log('🗄️ Still database/schema error');
      } else if (error.message.includes('invalid')) {
        console.log('📧 Email validation issue');
      } else {
        console.log('❓ Other error:', error.message);
      }
    } else {
      console.log('✅ SIGNUP SUCCESSFUL!');
      console.log('New user:', data.user?.email);
    }
  } catch (err) {
    console.log('❌ Signup exception:', err.message);
  }

  // Test 2: Try login with existing credentials but with error details
  console.log('\n=== Test 2: Login with Error Analysis ===');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'delsenterprise@gmail.com',
      password: 'delsenterprise123'
    });
    
    if (error) {
      console.log('❌ Login error details:');
      console.log('  Message:', error.message);
      console.log('  Status:', error.status);
      console.log('  Name:', error.name);
      
      if (error.message.includes('querying schema')) {
        console.log('🎯 Schema query error - likely missing table or view Supabase expects');
      }
    } else {
      console.log('✅ LOGIN SUCCESSFUL!');
      console.log('User:', data.user?.email);
    }
  } catch (err) {
    console.log('❌ Login exception:', err.message);
  }

  // Test 3: Check if we can manually create a profiles record
  console.log('\n=== Test 3: Manual Profiles Access ===');
  try {
    // Try to insert a test record into profiles
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: '00000000-0000-0000-0000-000000000001', // Test UUID
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .select();
      
    if (error) {
      console.log('❌ Profiles insert failed:', error.message);
      if (error.message.includes('permission denied')) {
        console.log('🚫 RLS still active on profiles table');
      }
    } else {
      console.log('✅ Profiles table accessible');
      console.log('Inserted record:', data);
    }
  } catch (err) {
    console.log('❌ Profiles test exception:', err.message);
  }

  console.log('\n=== Next Steps ===');
  console.log('If signup works but login fails:');
  console.log('1. The issue is specific to existing users or schema expectations');
  console.log('2. Try the signup first, then login with the new account');
  console.log('3. If profiles table still has RLS issues, we need another restart');
}

testAuthAfterCleanSlate().catch(console.error);