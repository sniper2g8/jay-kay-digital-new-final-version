require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSpecificationTables() {
  try {
    console.log('🔍 Checking specification-related tables...');
    
    // Check if finish_options table exists
    console.log('\n1. Checking finish_options table...');
    const { data: finishData, error: finishError } = await supabase
      .from('finish_options')
      .select('id, name, category')
      .limit(5);

    if (finishError) {
      console.log('❌ finish_options table not accessible:', finishError.message);
    } else {
      console.log('✅ finish_options table exists');
      console.log('📋 Sample finish options:', finishData);
    }
    
    // Check if there's a job_specifications or similar table
    console.log('\n2. Checking for job specifications tables...');
    
    // Try common table names
    const specTableNames = ['job_specifications', 'job_specs', 'specifications', 'job_details'];
    
    for (const tableName of specTableNames) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
          
        if (error) {
          console.log(`❌ ${tableName} table not found or not accessible`);
        } else {
          console.log(`✅ ${tableName} table exists`);
          if (data && data.length > 0) {
            console.log(`📋 Columns in ${tableName}:`, Object.keys(data[0]));
          }
        }
      } catch (err) {
        console.log(`❌ Error checking ${tableName}:`, err.message);
      }
    }
    
    // Check if jobs table has any JSON columns that might store specs
    console.log('\n3. Checking jobs table for JSON columns...');
    const { data: jobColumns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'jobs')
      .in('data_type', ['json', 'jsonb']);
    
    if (columnsError) {
      console.log('❌ Error checking jobs table columns:', columnsError.message);
    } else if (jobColumns && jobColumns.length > 0) {
      console.log('✅ Found JSON columns in jobs table:');
      jobColumns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log('📭 No JSON columns found in jobs table');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

checkSpecificationTables().catch(console.error);