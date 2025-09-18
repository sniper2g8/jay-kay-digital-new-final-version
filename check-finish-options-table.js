require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFinishOptionsTable() {
  try {
    console.log('🔍 Checking finish_options table in detail...');
    console.log('================================================');

    // Test 1: Basic table access
    console.log('\n1. Testing basic table access:');
    const { data: basicTest, error: basicError } = await supabase
      .from('finish_options')
      .select('*')
      .limit(1);

    if (basicError) {
      console.error('❌ Cannot access finish_options table:', basicError);
      return;
    }

    console.log('✅ finish_options table is accessible');

    // Test 2: Get table schema (column names)
    console.log('\n2. Table schema (columns):');
    const { data: schemaData, error: schemaError } = await supabase
      .from('finish_options')
      .select('*')
      .limit(1);

    if (schemaError) {
      console.error('❌ Schema check failed:', schemaError);
    } else {
      if (schemaData && schemaData.length > 0) {
        const columns = Object.keys(schemaData[0]);
        console.log('📋 Available columns:');
        columns.forEach((col, index) => {
          console.log(`   ${index + 1}. ${col}`);
        });
      } else {
        console.log('⚠️ Table exists but has no data - checking with empty select');
        
        // Try to get column info even with empty table
        const { data: emptyData, error: emptyError } = await supabase
          .from('finish_options')
          .select('*')
          .eq('id', 'non-existent-id'); // This will return empty but show column structure
        
        if (emptyError) {
          console.log('❌ Could not determine columns:', emptyError);
        } else {
          console.log('✅ Table structure accessible (but no data)');
        }
      }
    }

    // Test 3: Count total records
    console.log('\n3. Record count:');
    const { count, error: countError } = await supabase
      .from('finish_options')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Count failed:', countError);
    } else {
      console.log(`📊 Total records: ${count}`);
    }

    // Test 4: Get sample data (first 5 records)
    console.log('\n4. Sample data (first 5 records):');
    const { data: sampleData, error: sampleError } = await supabase
      .from('finish_options')
      .select('*')
      .limit(5);

    if (sampleError) {
      console.error('❌ Sample data fetch failed:', sampleError);
    } else {
      if (sampleData && sampleData.length > 0) {
        console.log('📄 Sample records:');
        sampleData.forEach((record, index) => {
          console.log(`\n   Record ${index + 1}:`);
          Object.entries(record).forEach(([key, value]) => {
            console.log(`     ${key}: ${value}`);
          });
        });
      } else {
        console.log('📭 No records found in table');
      }
    }

    // Test 5: Check for specific columns that might be related to jobs
    console.log('\n5. Looking for job-related columns:');
    const jobRelatedColumns = ['job_id', 'service_id', 'name', 'title', 'price', 'cost', 'description'];
    
    if (schemaData && schemaData.length > 0) {
      const actualColumns = Object.keys(schemaData[0]);
      const foundColumns = jobRelatedColumns.filter(col => actualColumns.includes(col));
      
      if (foundColumns.length > 0) {
        console.log('✅ Found job-related columns:');
        foundColumns.forEach(col => console.log(`   - ${col}`));
      } else {
        console.log('⚠️ No obvious job-related columns found');
      }
    }

    // Test 6: Check if there are any foreign key relationships
    console.log('\n6. Testing relationship with jobs table:');
    try {
      const { data: relationTest, error: relationError } = await supabase
        .from('finish_options')
        .select(`
          *,
          jobs (*)
        `)
        .limit(1);

      if (relationError) {
        console.log('❌ No direct relationship with jobs table:', relationError.message);
      } else {
        console.log('✅ Has relationship with jobs table');
      }
    } catch (err) {
      console.log('❌ Relationship test failed:', err.message);
    }

  } catch (error) {
    console.error('Overall check failed:', error);
  }
}

checkFinishOptionsTable().catch(console.error);