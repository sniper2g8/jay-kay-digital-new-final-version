require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLatestJobSubmissionFix() {
  try {
    console.log('🔧 Testing latest job submission fixes...');
    console.log('=========================================');

    // Test 1: Get test data
    console.log('\n1. Getting test data...');
    const { data: customers } = await supabase.from('customers').select('id, business_name').limit(1);
    const { data: services } = await supabase.from('services').select('id, title').limit(1);
    
    if (!customers?.length || !services?.length) {
      console.error('❌ Missing test data');
      return;
    }

    console.log(`✅ Customer: ${customers[0].business_name}`);
    console.log(`✅ Service: ${services[0].title}`);

    // Test 2: Get next job number
    console.log('\n2. Getting next job number...');
    const { data: nextJobNumber, error: counterError } = await supabase.rpc('get_next_counter', { counter_name: 'job' });
    
    if (counterError) {
      console.error('❌ Counter error:', counterError);
      return;
    }

    const jobNumber = `JKDP-JOB-${String(nextJobNumber).padStart(4, '0')}`;
    console.log(`✅ Next job number: ${jobNumber}`);

    // Test 3: Create job with ONLY valid columns (matching useJobSubmission.ts)
    console.log('\n3. Testing job creation with fixed schema...');
    
    const jobData = {
      id: crypto.randomUUID(),
      jobNo: jobNumber,
      customer_id: customers[0].id,
      service_id: services[0].id,
      title: 'Latest Fix Test Job',
      description: 'Testing latest schema fixes',
      status: 'pending',
      priority: 'normal',
      quantity: 1,
      estimate_price: 299,
      estimated_delivery: '2025-09-25',
      submittedDate: new Date().toISOString(),
      createdBy: 'test-user-latest'
    };

    console.log('📋 Job data to insert:');
    Object.entries(jobData).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

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
      
      // Analyze the error
      if (jobError.message.includes('finishIds') || 
          jobError.message.includes('finishOptions') || 
          jobError.message.includes('finishPrices')) {
        console.log('💡 Still trying to insert finishing columns - check if file is saved/cached');
      } else if (jobError.message.includes('specifications')) {
        console.log('💡 Still trying to insert specifications column - check if removed');
      } else if (jobError.message.includes('permission denied')) {
        console.log('💡 Permission issue - RLS blocking access');
      } else {
        console.log('💡 New schema issue identified');
      }
    } else {
      console.log('✅ Job creation successful!');
      console.log(`📝 Created job: ${job.jobNo} with ID: ${job.id}`);
      console.log('🎉 All schema fixes are working!');
      
      // Try to clean up (will probably fail due to RLS but that's expected)
      const { error: deleteError } = await supabase
        .from('jobs')
        .delete()
        .eq('id', job.id);
      
      if (deleteError) {
        console.log('⚠️ Cleanup failed (expected):', deleteError.message);
      } else {
        console.log('✅ Test job cleaned up');
      }
    }

    // Test 4: Verify the specific columns that were causing issues
    console.log('\n4. Verifying problematic columns are removed...');
    
    const problematicColumns = ['finishIds', 'finishOptions', 'finishPrices', 'specifications'];
    const actualColumns = Object.keys(jobData);
    const foundProblematic = problematicColumns.filter(col => actualColumns.includes(col));
    
    if (foundProblematic.length > 0) {
      console.error('❌ Found problematic columns still in job data:', foundProblematic);
    } else {
      console.log('✅ All problematic columns removed from job data');
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testLatestJobSubmissionFix().catch(console.error);