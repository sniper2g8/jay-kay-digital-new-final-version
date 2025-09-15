const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pnoxqzlxfuvjvufdjuqh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBub3hxemx4ZnV2anZ1ZmRqdXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczOTMxMzMsImV4cCI6MjA3Mjk2OTEzM30.QG0B60xV9TO2PaUeEOkzgqXcVuSkHVq3yYfXWKaaDzc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthWithMultipleApproaches() {
  console.log('🔐 Testing Auth with Multiple Approaches\n');
  
  // Test 1: Simple session check
  console.log('=== Test 1: Session Check ===');
  try {
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.log('❌ Session check failed:', sessionError.message);
    } else {
      console.log('✅ Session check successful');
      console.log('Current user:', session?.user?.email || 'No user');
    }
  } catch (err) {
    console.log('❌ Session check exception:', err.message);
  }

  // Test 2: Try to sign up a completely new user to bypass any existing user issues
  console.log('\n=== Test 2: New User Signup ===');
  const testEmail = `test-${Date.now()}@test.com`;
  const testPassword = 'TestPassword123!';
  
  try {
    console.log(`Attempting signup with: ${testEmail}`);
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });
    
    if (error) {
      console.log('❌ Signup failed:', error.message);
      console.log('Error status:', error.status);
      
      if (error.message.includes('converting NULL to string')) {
        console.log('🚨 STILL GETTING NULL CONVERSION ERROR ON SIGNUP!');
      } else {
        console.log('✅ No NULL conversion error - different issue');
      }
    } else {
      console.log('✅ Signup successful!');
      console.log('New user ID:', data.user?.id);
      console.log('Email confirmation needed:', !data.user?.email_confirmed_at);
    }
  } catch (err) {
    console.log('❌ Signup exception:', err.message);
  }

  // Test 3: Try password reset (this often triggers the token issue)
  console.log('\n=== Test 3: Password Reset ===');
  try {
    console.log('Attempting password reset for: delsenterprise@gmail.com');
    const { error } = await supabase.auth.resetPasswordForEmail('delsenterprise@gmail.com');
    
    if (error) {
      console.log('❌ Password reset failed:', error.message);
      if (error.message.includes('converting NULL to string')) {
        console.log('🚨 NULL CONVERSION ERROR ON PASSWORD RESET!');
      }
    } else {
      console.log('✅ Password reset initiated successfully');
    }
  } catch (err) {
    console.log('❌ Password reset exception:', err.message);
  }

  // Test 4: Database query test (bypass auth)
  console.log('\n=== Test 4: Direct Database Query ===');
  try {
    const { data, error } = await supabase
      .from('appUsers')
      .select('email, name')
      .limit(1);
      
    if (error) {
      console.log('❌ Database query failed:', error.message);
    } else {
      console.log('✅ Database query successful');
      console.log('Found users:', data?.length || 0);
    }
  } catch (err) {
    console.log('❌ Database query exception:', err.message);
  }

  console.log('\n=== Summary ===');
  console.log('If signup/password reset still show NULL conversion errors,');
  console.log('the issue is with Supabase auth service cache/configuration.');
  console.log('If they work, the issue is with existing user login only.');
}

console.log('🚀 Testing Authentication with Multiple Approaches');
console.log('📋 This will test signup, login, password reset, and database access');
console.log('🔧 Helps identify if the issue is with existing users or the auth service itself\n');

testAuthWithMultipleApproaches().catch(console.error);