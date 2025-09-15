const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pnoxqzlxfuvjvufdjuqh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBub3hxemx4ZnV2anZ1ZmRqdXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczOTMxMzMsImV4cCI6MjA3Mjk2OTEzM30.QG0B60xV9TO2PaUeEOkzgqXcVuSkHVq3yYfXWKaaDzc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCurrentAuthState() {
  console.log('🔍 Testing Current Auth State After All Fixes\n');
  
  // Test 1: Basic auth endpoint check
  console.log('=== Test 1: Basic Auth State ===');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.log('❌ Session check failed:', error.message);
    } else {
      console.log('✅ Session check works');
      console.log('Current session:', session ? 'ACTIVE' : 'NONE');
    }
  } catch (err) {
    console.log('❌ Session exception:', err.message);
  }

  // Test 2: Try login with known user
  console.log('\n=== Test 2: Login Test ===');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'delsenterprise@gmail.com',
      password: 'delsenterprise123'
    });
    
    if (error) {
      console.log('❌ Login failed:', error.message);
      console.log('Error status:', error.status);
      
      if (error.message.includes('converting NULL to string')) {
        console.log('🚨 NULL CONVERSION ERROR STILL PRESENT!');
      } else if (error.message.includes('Invalid login credentials')) {
        console.log('🔑 Credential issue - auth working but wrong password');
      } else if (error.message.includes('Database error')) {
        console.log('🗄️ Database/schema issue');
      } else {
        console.log('❓ Unknown error type:', error.message);
      }
    } else {
      console.log('✅ LOGIN SUCCESSFUL!');
      console.log('User:', data.user?.email);
      console.log('Session:', !!data.session);
    }
  } catch (err) {
    console.log('❌ Login exception:', err.message);
  }

  // Test 3: Try signup to see current behavior
  console.log('\n=== Test 3: Signup Test ===');
  const testEmail = `test-${Date.now()}@example.com`;
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!'
    });
    
    if (error) {
      console.log('❌ Signup failed:', error.message);
      console.log('Error status:', error.status);
      
      if (error.message.includes('converting NULL to string')) {
        console.log('🚨 NULL CONVERSION ERROR ON SIGNUP!');
      } else if (error.message.includes('Database error loading user')) {
        console.log('🗄️ Profile creation issue');
      } else {
        console.log('❓ Signup error:', error.message);
      }
    } else {
      console.log('✅ SIGNUP SUCCESSFUL!');
      console.log('New user:', data.user?.email);
      console.log('Email confirmation needed:', !data.user?.email_confirmed_at);
    }
  } catch (err) {
    console.log('❌ Signup exception:', err.message);
  }

  // Test 4: Check database table access
  console.log('\n=== Test 4: Database Access ===');
  try {
    const { data, error } = await supabase
      .from('appUsers')
      .select('id, email, name')
      .limit(1);
      
    if (error) {
      console.log('❌ appUsers query failed:', error.message);
    } else {
      console.log('✅ appUsers accessible');
      console.log('Records found:', data?.length || 0);
    }
  } catch (err) {
    console.log('❌ Database query exception:', err.message);
  }

  // Test 5: Check profiles table
  console.log('\n=== Test 5: Profiles Table ===');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .limit(1);
      
    if (error) {
      console.log('❌ profiles query failed:', error.message);
    } else {
      console.log('✅ profiles table accessible');
      console.log('Records found:', data?.length || 0);
    }
  } catch (err) {
    console.log('❌ profiles query exception:', err.message);
  }

  console.log('\n=== Summary ===');
  console.log('Check the results above to identify:');
  console.log('1. If NULL conversion errors persist');
  console.log('2. If database access is working');
  console.log('3. If the issue is with auth service vs database');
  console.log('4. If we need to restart Supabase again');
}

testCurrentAuthState().catch(console.error);