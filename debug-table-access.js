const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pnoxqzlxfuvjvufdjuqh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBub3hxemx4ZnV2anZ1ZmRqdXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczOTMxMzMsImV4cCI6MjA3Mjk2OTEzM30.QG0B60xV9TO2PaUeEOkzgqXcVuSkHVq3yYfXWKaaDzc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTableAccess() {
  console.log('🔍 Debug: Table Access and Schema Issues\n');
  
  // Test different possible table names
  const tableNames = ['appUsers', 'appusers', 'users', 'profiles'];
  
  for (const tableName of tableNames) {
    console.log(`=== Testing table: ${tableName} ===`);
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
        
      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
        if (error.message.includes('does not exist')) {
          console.log(`   Table "${tableName}" doesn't exist`);
        } else if (error.message.includes('permission')) {
          console.log(`   Table "${tableName}" exists but access denied (RLS issue)`);
        }
      } else {
        console.log(`✅ ${tableName}: Successfully accessed!`);
        console.log(`   Records found: ${data?.length || 0}`);
        if (data && data.length > 0) {
          console.log(`   Sample columns: ${Object.keys(data[0]).join(', ')}`);
        }
      }
    } catch (err) {
      console.log(`❌ ${tableName}: Exception - ${err.message}`);
    }
  }
  
  console.log('\n=== Auth Debug ===');
  
  // Test what happens with auth
  try {
    console.log('Testing auth state...');
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('❌ Auth error:', error.message);
    } else {
      console.log('Current user:', user ? user.email : 'No user');
    }
  } catch (err) {
    console.log('❌ Auth exception:', err.message);
  }
  
  console.log('\n=== Diagnosis ===');
  console.log('The issue is likely:');
  console.log('1. Table name mismatch (appUsers vs appusers)');
  console.log('2. Missing user profile table entirely');
  console.log('3. RLS blocking access to existing table');
  console.log('4. Supabase expecting a specific table structure for auth');
}

debugTableAccess().catch(console.error);