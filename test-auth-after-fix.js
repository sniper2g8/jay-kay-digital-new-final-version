const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pnoxqzlxfuvjvufdjuqh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBub3hxemx4ZnV2anZ1ZmRqdXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczOTMxMzMsImV4cCI6MjA3Mjk2OTEzM30.QG0B60xV9TO2PaUeEOkzgqXcVuSkHVq3yYfXWKaaDzc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
  console.log('🔐 Testing Authentication After Token Fix\n');
  
  try {
    // Test with a known user email
    const testEmail = 'delsenterprise@gmail.com';
    const testPassword = 'test123'; // You'll need to provide the actual password
    
    console.log(`Attempting login with: ${testEmail}`);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (error) {
      console.error('❌ Login failed:', error.message);
      console.error('Error code:', error.status);
      
      // Check if it's still the NULL conversion error
      if (error.message.includes('converting NULL to string')) {
        console.log('\n🚨 STILL GETTING NULL CONVERSION ERROR!');
        console.log('This suggests Supabase auth service needs to be restarted or there\'s a cache issue');
      } else {
        console.log('\n✅ Different error - NULL conversion issue appears to be fixed');
        console.log('This might be a normal auth error (wrong password, etc.)');
      }
    } else {
      console.log('✅ Login successful!');
      console.log('User ID:', data.user?.id);
      console.log('Email:', data.user?.email);
      console.log('\n🎉 Authentication system is working properly!');
    }
    
  } catch (err) {
    console.error('❌ Test failed with exception:', err.message);
  }
}

// Also test without login to see if we can check user existence
async function testUserCheck() {
  console.log('\n🔍 Testing User Query Without Auth\n');
  
  try {
    const { data, error } = await supabase
      .from('appUsers')
      .select('email, name')
      .limit(1);
      
    if (error) {
      console.error('❌ User query failed:', error.message);
    } else {
      console.log('✅ User query successful');
      console.log('Found users:', data?.length || 0);
    }
  } catch (err) {
    console.error('❌ User query exception:', err.message);
  }
}

console.log('🚀 Testing Authentication System After Token Fix');
console.log('📋 This will verify if the NULL token fix resolved the auth issues\n');

testLogin().then(() => {
  return testUserCheck();
}).catch(console.error);