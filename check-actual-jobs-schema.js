require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkActualJobsTableSchema() {
  try {
    console.log('🔍 Checking actual jobs table schema...');

    // Try to get column information by selecting specific columns
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error accessing jobs table:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Jobs table columns:');
      const columns = Object.keys(data[0]);
      columns.forEach(col => console.log(`  - ${col}`));
    } else {
      console.log('📭 Jobs table is empty, trying to get schema differently...');
      
      // Try to get schema from information schema
      const { data: schemaData, error: schemaError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'jobs')
        .order('ordinal_position');
      
      if (schemaError) {
        console.error('❌ Error getting schema:', schemaError);
      } else {
        console.log('📋 Jobs table schema from information_schema:');
        schemaData.forEach(col => {
          console.log(`  - ${col.column_name} (${col.data_type})`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

checkActualJobsTableSchema().catch(console.error);