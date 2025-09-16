// Test password recovery with different configurations
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testPwdRecoveryConfigs() {
  console.log('🧪 Testing Different Password Recovery Configurations...');
  console.log('=======================================================');
  
  const testEmail = 'admin@jaykaydigitalpress.com';
  
  // Test 1: With localhost redirect
  console.log('\n1️⃣ Testing with localhost redirect...');
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: 'http://localhost:3000/auth/reset-password'
    });
    
    if (error) {
      console.log('   ❌ Failed:', error.message);
    } else {
      console.log('   ✅ Success with localhost redirect');
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }
  
  // Test 2: Without custom redirect (use default)
  console.log('\n2️⃣ Testing without custom redirect URL...');
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(testEmail);
    
    if (error) {
      console.log('   ❌ Failed:', error.message);
    } else {
      console.log('   ✅ Success without custom redirect');
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }
  
  // Test 3: With different email
  console.log('\n3️⃣ Testing with different email...');
  try {
    const { error } = await supabase.auth.resetPasswordForEmail('test@example.com', {
      redirectTo: 'http://localhost:3000/auth/reset-password'
    });
    
    if (error) {
      console.log('   ❌ Failed:', error.message);
    } else {
      console.log('   ✅ Success with different email');
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Check Supabase Dashboard > Authentication > Settings');
  console.log('2. Verify Site URL is set to: http://localhost:3000');
  console.log('3. Add redirect URLs: http://localhost:3000/**');
  console.log('4. Check Authentication > Templates > Reset Password');
  console.log('5. Review Authentication > Logs for detailed errors');
}

testPwdRecoveryConfigs();