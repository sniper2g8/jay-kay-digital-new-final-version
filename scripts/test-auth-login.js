const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testAuthLogin() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log('🔐 Testing Supabase Auth Login...\n');

  // Test login with a user that was experiencing issues
  const testEmail = 'delsenterprise@gmail.com';
  const testPassword = 'test123'; // You'll need to use actual password
  
  console.log(`Attempting login for: ${testEmail}`);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (error) {
      console.log('❌ Auth Error:', error.message);
      console.log('🔍 Error Details:', JSON.stringify(error, null, 2));
      
      // Check if it's the specific token conversion error
      if (error.message.includes('converting NULL to string')) {
        console.log('\n🚨 CONFIRMED: Still seeing NULL to string conversion error!');
        console.log('📧 This requires Supabase Support intervention');
        console.log('🔗 The issue is in Supabase\'s auth service, not our database');
      }
    } else {
      console.log('✅ Login successful!');
      console.log('User:', data.user?.email);
      
      // Test logout
      await supabase.auth.signOut();
      console.log('✅ Logout successful!');
    }

  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
  }

  console.log('\n🎯 Auth test completed!');
}

console.log('⚠️  Note: This test requires a valid password for delsenterprise@gmail.com');
console.log('⚠️  If you don\'t have the password, the test will show an auth error (which is expected)');
console.log('⚠️  We\'re looking for the specific "converting NULL to string" error\n');

testAuthLogin().catch(console.error);