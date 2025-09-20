// Check current policies on appUsers table
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkAppUsersPolicies() {
  console.log('Checking appUsers table policies...');
  
  try {
    // Create client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Try to query the policies
    console.log('Attempting to query appUsers table...');
    const { data, error } = await supabase
      .from('appUsers')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Error querying appUsers table:', error.message);
      console.error('Error code:', error.code);
      return;
    }
    
    console.log('✅ Successfully queried appUsers table');
    console.log('Data:', data);
    
  } catch (error) {
    console.error('Exception occurred:', error.message);
  }
}

checkAppUsersPolicies();