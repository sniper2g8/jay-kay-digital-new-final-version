// Discover actual database schema to find user-related tables
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pnoxqzlxfuvjvufdjuqh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBub3hxemx4ZnV2anZ1ZmRqdXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczOTMxMzMsImV4cCI6MjA3Mjk2OTEzM30.QG0B60xV9TO2PaUeEOkzgqXcVuSkHVq3yYfXWKaaDzc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function discoverSchema() {
  console.log('🔍 Discovering actual database schema...\n');
  
  try {
    // Try to list all tables using information_schema
    console.log('1. Attempting to list all tables...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (tablesError) {
      console.log('Cannot access information_schema, trying manual discovery...');
      
      // Try common table names manually
      const possibleTables = [
        'users', 'user', 'profiles', 'user_profiles', 'accounts', 
        'app_users', 'appusers', 'appUsers', 'application_users',
        'customers', 'jobs', 'invoices', 'payments', 'services', 'inventory'
      ];
      
      console.log('2. Testing common table names...');
      const existingTables = [];
      
      for (const tableName of possibleTables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
            
          if (!error) {
            existingTables.push(tableName);
            console.log(`✅ Found table: ${tableName}`);
            
            // Show structure if data exists
            if (data && data.length > 0) {
              console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
            }
          }
        } catch (e) {
          // Table doesn't exist or no access
        }
      }
      
      console.log('\n📋 Summary of existing tables:');
      existingTables.forEach(table => console.log(`  - ${table}`));
      
    } else {
      console.log('✅ Successfully accessed table list:');
      tables.forEach(table => console.log(`  - ${table.table_name}`));
      
      // Look for user-related tables
      const userTables = tables.filter(t => 
        t.table_name.toLowerCase().includes('user') || 
        t.table_name.toLowerCase().includes('profile') ||
        t.table_name.toLowerCase().includes('account')
      );
      
      console.log('\n👤 User-related tables found:');
      userTables.forEach(table => console.log(`  - ${table.table_name}`));
      
      // Test structure of potential user tables
      for (const userTable of userTables) {
        try {
          console.log(`\n🔍 Examining ${userTable.table_name} structure...`);
          const { data, error } = await supabase
            .from(userTable.table_name)
            .select('*')
            .limit(1);
            
          if (!error) {
            if (data && data.length > 0) {
              console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
              console.log(`   Sample record:`, JSON.stringify(data[0], null, 2));
            } else {
              console.log('   Table exists but is empty');
            }
          } else {
            console.log(`   Access error: ${error.message}`);
          }
        } catch (e) {
          console.log(`   Exception: ${e.message}`);
        }
      }
    }
    
    // Check auth.users table (Supabase built-in)
    console.log('\n🔐 Checking Supabase auth.users table...');
    try {
      const { data: authUsers, error: authError } = await supabase.auth.getUser();
      console.log('Auth user check:', authError ? 'No authenticated user' : 'User found');
    } catch (e) {
      console.log('Auth check failed:', e.message);
    }
    
  } catch (err) {
    console.error('General error:', err);
  }
}

discoverSchema();