// Check actual database schema
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pnoxqzlxfuvjvufdjuqh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBub3hxemx4ZnV2anZ1ZmRqdXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczOTMxMzMsImV4cCI6MjA3Mjk2OTEzM30.QG0B60xV9TO2PaUeEOkzgqXcVuSkHVq3yYfXWKaaDzc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    console.log('Checking actual database schema...\n');
    
    // Try to query the customers table and see what columns exist
    console.log('1. Attempting to query customers table...');
    const { data: customers, error } = await supabase
      .from('customers')
      .select()
      .limit(1);
      
    if (error) {
      console.error('Error querying customers:', error.message);
      console.error('Code:', error.code);
      
      // If we can't access the table, try to check if it exists
      console.log('\n2. Checking if customers table exists via information_schema...');
      const { data: tableCheck, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'customers');
        
      if (tableError) {
        console.error('Cannot access information_schema:', tableError.message);
      } else {
        console.log('Tables found:', tableCheck);
      }
    } else {
      console.log('Successfully queried customers table!');
      console.log('Sample record structure:', JSON.stringify(customers[0], null, 2));
    }
    
    // Try alternative table names that might exist
    console.log('\n3. Checking for alternative table names...');
    const possibleTables = ['customer', 'Customer', 'Customers'];
    
    for (const tableName of possibleTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select()
          .limit(1);
          
        if (!error) {
          console.log(`✓ Found table: ${tableName}`);
          console.log(`Sample record:`, JSON.stringify(data[0], null, 2));
        }
      } catch (e) {
        // Ignore errors for non-existent tables
      }
    }
    
    // List all tables we can access
    console.log('\n4. Listing all accessible tables...');
    const { data: allTables, error: allTablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
      
    if (allTablesError) {
      console.error('Cannot list tables:', allTablesError.message);
    } else {
      console.log('Available tables:', allTables.map(t => t.table_name));
    }
    
  } catch (err) {
    console.error('General error:', err);
  }
}

checkSchema();