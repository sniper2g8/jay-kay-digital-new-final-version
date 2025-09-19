require('dotenv').config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testJobSubmission() {
  try {
    console.log('🧪 Testing job submission with correct schema...');

    // Get test data
    const { data: customers } = await supabase.from('customers').select('id').limit(1);
    const { data: services } = await supabase.from('services').select('id').limit(1);
    const { data: nextJobNumber } = await supabase.rpc('get_next_counter', { counter_name: 'job' });
    
    const jobNumber = `JKDP-JOB-${String(nextJobNumber).padStart(4, '0')}`;
    
    // Test 1: Minimal job data (only required columns)
    console.log('\n=== Test 1: Minimal Job Data ===');
    const minimalJobData = {
      id: crypto.randomUUID(),
      jobNo: jobNumber,
      customer_id: customers[0].id,
      service_id: services[0].id,
      title: 'Test Minimal Job',
      status: 'pending',
      priority: 'normal',
      quantity: 1,
      estimate_price: 100,
      submittedDate: new Date().toISOString(),
      createdBy: 'test-user'
    };

    const { data: minimalJob, error: minimalError } = await supabase
      .from('jobs')
      .insert([minimalJobData])
      .select()
      .single();

    if (minimalError) {
      console.error('❌ Minimal job creation failed:', minimalError);
    } else {
      console.log('✅ Minimal job creation successful!');
    }

    // Test 2: Job data with specifications
    console.log('\n=== Test 2: Job Data with Specifications ===');
    const { data: nextJobNumber2 } = await supabase.rpc('get_next_counter', { counter_name: 'job' });
    const jobNumber2 = `JKDP-JOB-${String(nextJobNumber2).padStart(4, '0')}`;
    
    const jobWithSpecs = {
      id: crypto.randomUUID(),
      jobNo: jobNumber2,
      customer_id: customers[0].id,
      service_id: services[0].id,
      title: 'Test Job with Specs',
      description: 'Test description',
      status: 'pending',
      priority: 'normal',
      quantity: 1,
      estimate_price: 150,
      estimated_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      specifications: {
        requirements: 'Test requirements',
        size: { type: 'standard', preset: 'A4' },
        paper: { type: 'glossy', weight: '200gsm' }
      },
      submittedDate: new Date().toISOString(),
      createdBy: 'test-user'
    };

    const { data: specJob, error: specError } = await supabase
      .from('jobs')
      .insert([jobWithSpecs])
      .select()
      .single();

    if (specError) {
      console.error('❌ Job with specifications failed:', specError);
      if (specError.message.includes('specifications')) {
        console.log('💡 The specifications column might not exist or might not accept JSON');
      }
    } else {
      console.log('✅ Job with specifications successful!');
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testJobSubmission().catch(console.error);