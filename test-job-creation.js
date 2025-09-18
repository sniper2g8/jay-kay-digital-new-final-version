require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testJobCreation() {
  try {
    console.log('🧪 Testing job creation independently...');

    // First, get available customers and services
    console.log('\n=== Getting test data ===');
    
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id, business_name')
      .limit(1);
    
    if (customerError) {
      console.error('Customer fetch error:', customerError);
      return;
    }

    const { data: services, error: serviceError } = await supabase
      .from('services')
      .select('id, title')
      .limit(1);
    
    if (serviceError) {
      console.error('Service fetch error:', serviceError);
      return;
    }

    if (!customers?.length || !services?.length) {
      console.error('Need at least one customer and one service in database');
      return;
    }

    console.log('✅ Found test customer:', customers[0].business_name);
    console.log('✅ Found test service:', services[0].title);

    // Get next job number
    console.log('\n=== Getting next job number ===');
    const { data: nextJobNumber, error: counterError } = await supabase.rpc(
      'get_next_counter',
      { counter_name: 'job' }
    );

    if (counterError) {
      console.error('Counter error:', {
        message: counterError.message,
        code: counterError.code,
        details: counterError.details,
        hint: counterError.hint
      });
      return;
    }

    console.log('✅ Next job number:', nextJobNumber);
    const jobNumber = `JKDP-JOB-${String(nextJobNumber).padStart(4, '0')}`;
    console.log('✅ Formatted job number:', jobNumber);

    // Create minimal test job
    console.log('\n=== Creating test job ===');
    const testJobData = {
      id: crypto.randomUUID(),
      jobNo: jobNumber,
      customer_id: customers[0].id,
      service_id: services[0].id,
      title: 'Test Job Creation',
      description: 'Testing job creation functionality',
      status: 'pending',
      priority: 'normal',
      quantity: 1,
      estimate_price: 100,
      submittedDate: new Date().toISOString(),
      createdBy: 'test-user-id'
    };

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert([testJobData])
      .select()
      .single();

    if (jobError) {
      console.error('❌ Job creation failed:', {
        message: jobError.message,
        code: jobError.code,
        details: jobError.details,
        hint: jobError.hint
      });
      
      // Analyze the error
      if (jobError.message.includes('permission denied')) {
        console.log('💡 This is a permission issue - RLS policies are blocking job creation');
      } else if (jobError.message.includes('foreign key')) {
        console.log('💡 This is a foreign key constraint issue - customer or service ID is invalid');
      } else if (jobError.message.includes('duplicate')) {
        console.log('💡 This is a duplicate key issue - job number already exists');
      }
    } else {
      console.log('✅ Job created successfully!');
      console.log('Job ID:', job.id);
      console.log('Job Number:', job.jobNo);
      
      // Clean up test job
      console.log('\n=== Cleaning up ===');
      const { error: deleteError } = await supabase
        .from('jobs')
        .delete()
        .eq('id', job.id);
      
      if (deleteError) {
        console.error('Delete error:', deleteError);
      } else {
        console.log('✅ Test job cleaned up');
      }
    }

  } catch (error) {
    console.error('Test failed with exception:', error);
  }
}

testJobCreation().catch(console.error);