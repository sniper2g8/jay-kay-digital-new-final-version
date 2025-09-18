require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJobSpecifications() {
  try {
    console.log('🔍 Checking job specifications data...');
    
    // Get a few sample jobs to see what data is available
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .limit(5);

    if (jobsError) {
      console.error('❌ Error fetching jobs:', jobsError);
      return;
    }

    console.log(`✅ Found ${jobs.length} sample jobs:`);
    
    jobs.forEach((job, index) => {
      console.log(`\n📋 Job ${index + 1}:`);
      console.log(`  - ID: ${job.id}`);
      console.log(`  - Title: ${job.title}`);
      console.log(`  - Job No: ${job.jobNo}`);
      
      // Check for any specification-related fields
      const specFields = Object.keys(job).filter(key => 
        key.includes('spec') || key.includes('size') || key.includes('paper') || key.includes('finish')
      );
      
      if (specFields.length > 0) {
        console.log(`  - Specification fields: ${specFields.join(', ')}`);
        specFields.forEach(field => {
          console.log(`    ${field}: ${JSON.stringify(job[field])}`);
        });
      } else {
        console.log(`  - No obvious specification fields found`);
        
        // Show all fields to see what's available
        const allFields = Object.keys(job);
        console.log(`  - All fields: ${allFields.join(', ')}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

checkJobSpecifications().catch(console.error);