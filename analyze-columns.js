const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function analyzeJobsTable() {
  console.log('🔍 Analyzing jobs table columns...');
  
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('📊 Available columns:');
      Object.keys(data[0]).forEach(col => console.log('  -', col));
      
      console.log('\n💰 Price-related columns analysis:');
      for (const job of data) {
        console.log(`Job ${job.jobNo || job.id}:`);
        console.log(`  unit_price: ${job.unit_price || 'NULL'}`);
        console.log(`  estimate_price: ${job.estimate_price || 'NULL'}`);
        console.log(`  estimated_cost: ${job.estimated_cost || 'NULL'}`);
        console.log(`  final_cost: ${job.final_cost || 'NULL'}`);
        console.log(`  estimate JSON: ${job.estimate ? 'EXISTS' : 'NULL'}`);
        console.log('---');
      }
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

analyzeJobsTable();