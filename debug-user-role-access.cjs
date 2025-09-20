// Debug script to check user role access in detail
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Create service role client for admin access
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function debugUserRoleAccess() {
  console.log('Debugging user role access...');
  
  try {
    // Get a list of users to test with
    const { data: users, error: usersError } = await supabaseAdmin
      .from('appUsers')
      .select('id, email, primary_role')
      .limit(3);
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }
    
    console.log('Found users:', users);
    
    if (users.length === 0) {
      console.log('No users found in appUsers table');
      return;
    }
    
    // Test access for the first user
    const testUser = users[0];
    console.log('\nTesting access for user:', testUser.email);
    
    // Try to access the user's own record using service role (should work)
    console.log('\n1. Testing service role access to own record...');
    const { data: serviceData, error: serviceError } = await supabaseAdmin
      .from('appUsers')
      .select('id, email, name, primary_role, human_id, status')
      .eq('id', testUser.id)
      .single();
    
    if (serviceError) {
      console.error('Service role access failed:', serviceError);
    } else {
      console.log('Service role access successful:', serviceData);
    }
    
    // Check current RLS policies
    console.log('\n2. Checking current RLS policies on appUsers table...');
    const { data: policies, error: policiesError } = await supabaseAdmin
      .rpc('get_policies', { table_name: 'appUsers' });
    
    if (policiesError) {
      console.error('Error fetching policies:', policiesError);
    } else {
      console.log('Current policies:');
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname}: ${policy.qual}`);
      });
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

debugUserRoleAccess();