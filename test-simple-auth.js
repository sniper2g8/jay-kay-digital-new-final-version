const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pnoxqzlxfuvjvufdjuqh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBub3hxemx4ZnV2anZ1ZmRqdXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczOTMxMzMsImV4cCI6MjA3Mjk2OTEzM30.QG0B60xV9TO2PaUeEOkzgqXcVuSkHVq3yYfXWKaaDzc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSimpleAuth() {
  console.log('🔐 Testing Simple Authentication (Post-Cache-Clear)\n');
  
  console.log('=== Test: Basic Auth Check ===');
  try {
    // First, try to see what the auth state is
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Session error:', sessionError.message);
    } else {
      console.log('Current session status:', session ? 'ACTIVE' : 'NO SESSION');
      if (session) {
        console.log('User:', session.user.email);
      }
    }
  } catch (err) {
    console.log('❌ Session check failed:', err.message);
  }

  console.log('\n=== Test: Login Attempt ===');
  try {
    console.log('Attempting login...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'delsenterprise@gmail.com',
      password: 'delsenterprise123'
    });

    if (error) {
      console.log('❌ Login failed:', error.message);
      console.log('Error status:', error.status);
      
      // Check specific error types
      if (error.message.includes('Invalid login credentials')) {
        console.log('🔑 Credentials issue - check password');
      } else if (error.message.includes('Database error')) {
        console.log('🗄️ Database/RLS issue - user exists but can\'t be loaded');
      } else if (error.message.includes('converting NULL to string')) {
        console.log('🚨 NULL conversion error still present');
      } else {
        console.log('❓ Unknown error type');
      }
    } else {
      console.log('✅ LOGIN SUCCESSFUL!');
      console.log('User ID:', data.user?.id);
      console.log('Email:', data.user?.email);
      console.log('Session valid:', !!data.session);
    }
  } catch (err) {
    console.log('❌ Login exception:', err.message);
  }

  console.log('\n=== Next Steps ===');
  console.log('1. If login works here but fails in browser: Check frontend auth setup');
  console.log('2. If still getting database errors: Check RLS policies');
  console.log('3. If NULL errors persist: Restart didn\'t clear cache completely');
  console.log('4. Try the login page in your browser now!');
}

testSimpleAuth().catch(console.error);