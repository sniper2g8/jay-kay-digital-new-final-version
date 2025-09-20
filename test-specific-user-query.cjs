// Test the specific user query that was failing
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testSpecificUserQuery() {
  console.log('Testing specific user query...');
  
  try {
    // Create client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Try the specific query that was failing
    console.log('Attempting the specific user query...');
    const { data, error } = await supabase
      .from('appUsers')
      .select('id,email,name,primary_role,human_id,status')
      .eq('id', '337eb073-1bfd-4879-94b7-653bda239e06');
    
    if (error) {
      console.error('Error querying specific user:', error.message);
      console.error('Error code:', error.code);
      return;
    }
    
    console.log('✅ Successfully queried specific user');
    console.log('Data:', data);
    
  } catch (error) {
    console.error('Exception occurred:', error.message);
  }
}

testSpecificUserQuery();