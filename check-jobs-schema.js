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

async function checkJobsSchema() {
  try {
    console.log('🔍 Checking jobs table schema...');
    
    // Get table info
    const { data: tableInfo, error: tableError } = await supabase
      .from('jobs')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Error accessing jobs table:', tableError);
      return;
    }

    // Get column information
    const { data: columns, error: columnsError } = await supabase
      .from('jobs')
      .select('*')
      .limit(0); // This will return column info without data

    console.log('✅ Jobs table accessible');
    console.log('📋 Column structure:');
    
    if (columns && columns.length >= 0) {
      // Get the column names from the first row (empty object)
      const columnNames = Object.keys(columns[0] || {});
      columnNames.forEach(col => console.log(`  - ${col}`));
    }

    // Test counter function
    console.log('\n🔍 Testing get_next_counter function...');
    const { data: counterResult, error: counterError } = await supabase
      .rpc('get_next_counter', { counter_name: 'job' });

    if (counterError) {
      console.error('❌ Counter function error:', counterError);
    } else {
      console.log('✅ Counter function works, next job number:', counterResult);
    }

    // Test job creation with minimal data
    console.log('\n🧪 Testing minimal job creation...');
    
    // Get test customer and service
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .limit(1);

    if (customerError) {
      console.error('❌ Customer fetch error:', customerError);
      return;
    }

    const { data: services, error: serviceError } = await supabase
      .from('services')
      .select('id')
      .limit(1);

    if (serviceError) {
      console.error('❌ Service fetch error:', serviceError);
      return;
    }

    if (!customers?.length || !services?.length) {
      console.error('❌ Need at least one customer and one service');
      return;
    }

    const jobData = {
      id: require('crypto').randomUUID(),
      jobNo: `TEST-JOB-${Date.now()}`,
      customer_id: customers[0].id,
      service_id: services[0].id,
      title: 'Schema Test Job',
      status: 'pending',
      priority: 'normal',
      quantity: 1,
      estimate_price: 100,
      submittedDate: new Date().toISOString(),
      createdBy: 'schema-test'
    };

    console.log('📋 Test job data:', JSON.stringify(jobData, null, 2));

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert([jobData])
      .select()
      .single();

    if (jobError) {
      console.error('❌ Job creation failed:', {
        message: jobError.message,
        code: jobError.code,
        details: jobError.details,
        hint: jobError.hint
      });
    } else {
      console.log('✅ Job creation successful!');
      console.log('📋 Created job:', job);
      
      // Clean up test job
      await supabase
        .from('jobs')
        .delete()
        .eq('id', job.id);
      console.log('🧹 Cleaned up test job');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

checkJobsSchema().catch(console.error);