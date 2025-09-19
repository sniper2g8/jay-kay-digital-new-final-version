import { createClient } from '@supabase/supabase-js';;
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabaseFunctions() {
  console.log('🔍 Checking for existing notification functions...\n');
  
  try {
    // Check for notification functions
    console.log('1. Checking for notification functions:');
    const { data: functions, error: funcError } = await supabase
      .from('pg_proc')
      .select('proname')
      .like('proname', '%notify%');
    
    if (funcError) {
      console.log('⚠️  Cannot query pg_proc (expected with limited permissions)');
    } else {
      console.log('Functions found:', functions);
    }

    // Check if there are recent errors in logs
    console.log('\n2. Testing basic job query to see actual error:');
    const { data: jobs, error: jobError } = await supabase
      .from('jobs')
      .select('id, title, status, customer_id')
      .limit(1);
    
    if (jobError) {
      console.log('❌ Job query error:', jobError);
    } else {
      console.log('✅ Job query successful:', jobs);
    }

    // Check customers table structure
    console.log('\n3. Verifying customers table:');
    const { data: customers, error: custError } = await supabase
      .from('customers')
      .select('id, email, business_name, contact_person')
      .limit(1);
    
    if (custError) {
      console.log('❌ Customers query error:', custError);
    } else {
      console.log('✅ Customers query successful');
      console.log('Available columns:', customers[0] ? Object.keys(customers[0]) : 'No data');
    }

    // Try to manually trigger a status update to see the error
    console.log('\n4. Testing status update that might trigger the error:');
    if (jobs && jobs.length > 0) {
      const jobId = jobs[0].id;
      const { data: updateData, error: updateError } = await supabase
        .from('jobs')
        .update({ status: 'in_progress' })
        .eq('id', jobId)
        .select();
      
      if (updateError) {
        console.log('❌ Status update error:', updateError);
      } else {
        console.log('✅ Status update successful');
      }
    }

  } catch (error) {
    console.error('Error checking database:', error);
  }
}

checkDatabaseFunctions();