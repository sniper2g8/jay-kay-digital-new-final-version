require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing service role credentials');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkFinishOptionsTableAdmin() {
  try {
    console.log('🔧 Checking finish_options table with admin access...');
    console.log('====================================================');

    // Test 1: Basic table access with admin
    console.log('\n1. Testing admin table access:');
    const { data: basicTest, error: basicError } = await supabaseAdmin
      .from('finish_options')
      .select('*')
      .limit(1);

    if (basicError) {
      console.error('❌ Admin cannot access finish_options table:', basicError);
      console.log('💡 This table might not exist or has very strict RLS policies');
      
      // Let's check if the table exists at all by trying different approaches
      console.log('\n2. Checking if table exists in schema:');
      
      // Try to list all tables to see what's available
      try {
        console.log('   Attempting to list available tables...');
        
        // Check some common table names
        const tablesToCheck = ['jobs', 'services', 'customers', 'finishing_options', 'finish_options', 'finishes'];
        
        for (const tableName of tablesToCheck) {
          try {
            const { data, error } = await supabaseAdmin
              .from(tableName)
              .select('*', { count: 'exact', head: true });
            
            if (!error) {
              console.log(`   ✅ Table '${tableName}' exists and is accessible`);
            } else if (error.code === 'PGRST116') {
              console.log(`   ❌ Table '${tableName}' does not exist`);
            } else {
              console.log(`   ⚠️ Table '${tableName}' exists but has access issues: ${error.message}`);
            }
          } catch (err) {
            console.log(`   ❌ Error checking '${tableName}': ${err.message}`);
          }
        }
      } catch (err) {
        console.error('Table listing failed:', err);
      }
      
      return;
    }

    console.log('✅ finish_options table is accessible with admin');

    // Test 2: Get table schema (column names)
    console.log('\n2. Table schema (columns):');
    if (basicTest && basicTest.length > 0) {
      const columns = Object.keys(basicTest[0]);
      console.log('📋 Available columns:');
      columns.forEach((col, index) => {
        console.log(`   ${index + 1}. ${col}`);
      });
      
      console.log('\n📄 First record sample:');
      Object.entries(basicTest[0]).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    } else {
      console.log('⚠️ Table exists but has no data');
      
      // Try to get schema info anyway
      const { data: emptyData, error: emptyError } = await supabaseAdmin
        .from('finish_options')
        .select('*')
        .eq('id', 'non-existent-id');
      
      console.log('📋 Table structure accessible (empty result shows columns in error)');
    }

    // Test 3: Count total records
    console.log('\n3. Record count:');
    const { count, error: countError } = await supabaseAdmin
      .from('finish_options')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Count failed:', countError);
    } else {
      console.log(`📊 Total records: ${count}`);
    }

    // Test 4: Get all data if count is reasonable
    if (count && count <= 20) {
      console.log('\n4. All records (table has few records):');
      const { data: allData, error: allError } = await supabaseAdmin
        .from('finish_options')
        .select('*')
        .order('id');

      if (allError) {
        console.error('❌ All data fetch failed:', allError);
      } else {
        allData.forEach((record, index) => {
          console.log(`\n   Record ${index + 1}:`);
          Object.entries(record).forEach(([key, value]) => {
            console.log(`     ${key}: ${value}`);
          });
        });
      }
    } else if (count && count > 20) {
      console.log('\n4. Sample data (first 10 records):');
      const { data: sampleData, error: sampleError } = await supabaseAdmin
        .from('finish_options')
        .select('*')
        .limit(10);

      if (sampleError) {
        console.error('❌ Sample data fetch failed:', sampleError);
      } else {
        sampleData.forEach((record, index) => {
          console.log(`\n   Record ${index + 1}:`);
          Object.entries(record).forEach(([key, value]) => {
            console.log(`     ${key}: ${value}`);
          });
        });
      }
    }

  } catch (error) {
    console.error('Overall admin check failed:', error);
  }
}

checkFinishOptionsTableAdmin().catch(console.error);