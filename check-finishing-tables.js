require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkFinishingTables() {
  try {
    console.log('🔧 Checking FINISHING-related tables with admin access...');
    console.log('=======================================================');

    // Check both finishing_options and finishes tables
    const tablesToCheck = ['finishing_options', 'finishes'];

    for (const tableName of tablesToCheck) {
      console.log(`\n🔍 === TABLE: ${tableName} ===`);
      
      try {
        // Test 1: Basic access and schema
        const { data: basicData, error: basicError } = await supabaseAdmin
          .from(tableName)
          .select('*')
          .limit(1);

        if (basicError) {
          console.error(`❌ Cannot access ${tableName}:`, basicError);
          continue;
        }

        console.log(`✅ ${tableName} is accessible`);

        // Test 2: Schema
        if (basicData && basicData.length > 0) {
          const columns = Object.keys(basicData[0]);
          console.log(`📋 Columns in ${tableName}:`);
          columns.forEach((col, index) => {
            console.log(`   ${index + 1}. ${col}`);
          });
        }

        // Test 3: Count
        const { count, error: countError } = await supabaseAdmin
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (!countError) {
          console.log(`📊 Total records in ${tableName}: ${count}`);
        }

        // Test 4: Get all data if reasonable count
        if (count && count <= 50) {
          console.log(`\n📄 All records in ${tableName}:`);
          const { data: allData, error: allError } = await supabaseAdmin
            .from(tableName)
            .select('*')
            .order('id');

          if (!allError && allData) {
            allData.forEach((record, index) => {
              console.log(`\n   Record ${index + 1}:`);
              Object.entries(record).forEach(([key, value]) => {
                console.log(`     ${key}: ${value}`);
              });
            });
          }
        } else if (count && count > 50) {
          console.log(`\n📄 Sample records in ${tableName} (first 5):`);
          const { data: sampleData, error: sampleError } = await supabaseAdmin
            .from(tableName)
            .select('*')
            .limit(5);

          if (!sampleError && sampleData) {
            sampleData.forEach((record, index) => {
              console.log(`\n   Record ${index + 1}:`);
              Object.entries(record).forEach(([key, value]) => {
                console.log(`     ${key}: ${value}`);
              });
            });
          }
        }

        // Test 5: Check for job relationships
        console.log(`\n🔗 Checking ${tableName} relationships:`);
        try {
          // Try to see if there are any foreign key references
          const columns = basicData && basicData.length > 0 ? Object.keys(basicData[0]) : [];
          const jobColumns = columns.filter(col => col.includes('job') || col.includes('service'));
          
          if (jobColumns.length > 0) {
            console.log(`   ✅ Found job/service related columns: ${jobColumns.join(', ')}`);
          } else {
            console.log(`   ⚠️ No obvious job/service related columns found`);
          }
        } catch (err) {
          console.log(`   ❌ Relationship check failed: ${err.message}`);
        }

      } catch (error) {
        console.error(`Error checking ${tableName}:`, error);
      }
    }

    // Test 6: Check if there's a junction table for jobs and finishing options
    console.log('\n🔗 === CHECKING FOR JUNCTION TABLES ===');
    const junctionTables = ['job_finishing_options', 'jobs_finishing_options', 'job_finishes', 'jobs_finishes'];
    
    for (const junctionTable of junctionTables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(junctionTable)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          console.log(`✅ Found junction table: ${junctionTable} (${data} records)`);
          
          // Get schema for junction table
          const { data: junctionData, error: junctionError } = await supabaseAdmin
            .from(junctionTable)
            .select('*')
            .limit(1);
            
          if (!junctionError && junctionData && junctionData.length > 0) {
            const columns = Object.keys(junctionData[0]);
            console.log(`   Columns: ${columns.join(', ')}`);
          }
        }
      } catch (err) {
        // Table doesn't exist, that's fine
      }
    }

  } catch (error) {
    console.error('Overall check failed:', error);
  }
}

checkFinishingTables().catch(console.error);