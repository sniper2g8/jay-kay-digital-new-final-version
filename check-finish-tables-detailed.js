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

async function checkFinishOptionsAndJunctions() {
  try {
    console.log('🔧 Checking finish_options and junction tables with admin...');
    console.log('==========================================================');

    // First, let's try to bypass RLS completely by using a different approach
    console.log('\n🔍 === TABLE: finish_options (trying different access methods) ===');
    
    // Method 1: Try with service role and explicit schema
    try {
      const { data, error } = await supabaseAdmin
        .from('finish_options')
        .select('*')
        .limit(3);

      if (error) {
        console.log('❌ Method 1 failed:', error.message);
        
        // Method 2: Try using raw RPC call to get table info
        try {
          console.log('\n🔧 Trying RPC method to check table...');
          const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('exec', {
            sql: 'SELECT * FROM finish_options LIMIT 3;'
          });
          
          if (rpcError) {
            console.log('❌ RPC method failed:', rpcError.message);
          } else {
            console.log('✅ RPC method worked:', rpcData);
          }
        } catch (rpcErr) {
          console.log('❌ RPC method not available');
        }
      } else {
        console.log('✅ finish_options table access successful!');
        
        if (data && data.length > 0) {
          const columns = Object.keys(data[0]);
          console.log('📋 Columns in finish_options:');
          columns.forEach((col, index) => {
            console.log(`   ${index + 1}. ${col}`);
          });
          
          console.log('\n📄 Sample records:');
          data.forEach((record, index) => {
            console.log(`\n   Record ${index + 1}:`);
            Object.entries(record).forEach(([key, value]) => {
              console.log(`     ${key}: ${value}`);
            });
          });
        } else {
          console.log('📭 finish_options table is empty');
        }
      }
    } catch (err) {
      console.log('❌ All methods failed for finish_options:', err.message);
    }

    // Now check the junction tables that we found
    console.log('\n\n🔗 === JUNCTION TABLES ===');
    const junctionTables = ['job_finishing_options', 'jobs_finishing_options', 'job_finishes', 'jobs_finishes'];
    
    for (const tableName of junctionTables) {
      console.log(`\n🔍 Checking ${tableName}:`);
      
      try {
        const { data, error } = await supabaseAdmin
          .from(tableName)
          .select('*')
          .limit(3);

        if (error) {
          console.log(`❌ ${tableName} access failed:`, error.message);
        } else {
          console.log(`✅ ${tableName} is accessible`);
          
          // Get count
          const { count, error: countError } = await supabaseAdmin
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          if (!countError) {
            console.log(`📊 Records count: ${count}`);
          }
          
          if (data && data.length > 0) {
            const columns = Object.keys(data[0]);
            console.log(`📋 Columns: ${columns.join(', ')}`);
            
            console.log('📄 Sample data:');
            data.forEach((record, index) => {
              console.log(`   Record ${index + 1}: ${JSON.stringify(record)}`);
            });
          } else {
            console.log('📭 Table is empty');
            
            // Even if empty, try to get schema by doing a query that will fail but show columns
            try {
              const { data: schemaData, error: schemaError } = await supabaseAdmin
                .from(tableName)
                .select('*')
                .eq('nonexistent_column', 'test');
              
              // This should fail but might give us column info in the error
            } catch (schemaErr) {
              // Check if error message contains column info
              if (schemaErr.message && schemaErr.message.includes('column')) {
                console.log(`🔍 Schema hint from error: ${schemaErr.message}`);
              }
            }
          }
        }
      } catch (err) {
        console.log(`❌ ${tableName} check failed:`, err.message);
      }
    }

    // Let's also check what the jobs table schema shows about finishing options
    console.log('\n\n📋 === JOBS TABLE FINISHING COLUMNS ===');
    try {
      const { data: jobData, error: jobError } = await supabaseAdmin
        .from('jobs')
        .select('*')
        .limit(1);

      if (!jobError && jobData && jobData.length > 0) {
        const columns = Object.keys(jobData[0]);
        const finishColumns = columns.filter(col => 
          col.toLowerCase().includes('finish') || 
          col.toLowerCase().includes('option')
        );
        
        if (finishColumns.length > 0) {
          console.log('✅ Found finish-related columns in jobs table:');
          finishColumns.forEach(col => {
            console.log(`   - ${col}: ${jobData[0][col]}`);
          });
        } else {
          console.log('⚠️ No finish-related columns found in jobs table');
        }
      }
    } catch (err) {
      console.log('❌ Jobs table check failed:', err.message);
    }

  } catch (error) {
    console.error('Overall check failed:', error);
  }
}

checkFinishOptionsAndJunctions().catch(console.error);