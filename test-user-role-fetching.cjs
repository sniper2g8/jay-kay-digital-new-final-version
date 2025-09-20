// Test script to verify user role fetching
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUserRoleFetching() {
  console.log('Testing user role fetching...');
  
  try {
    // First, check if we can get a session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return;
    }
    
    if (!session?.user) {
      console.log('No authenticated user found');
      return;
    }
    
    console.log('Current user ID:', session.user.id);
    
    // Try to fetch user role data
    const { data, error } = await supabase
      .from('appUsers')
      .select('id, email, name, primary_role, human_id, status')
      .eq('id', session.user.id)
      .single();
    
    if (error) {
      console.error('Error fetching user role:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return;
    }
    
    console.log('User role data:', data);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testUserRoleFetching();