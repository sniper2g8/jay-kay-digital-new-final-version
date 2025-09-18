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

async function testFixedJobSubmission() {
  try {
    console.log('🧪 Testing FIXED job submission...');

    // Get test customer and service
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id, business_name')
      .limit(1);

    if (customerError) {
      console.error('❌ Customer fetch error:', customerError);
      return;
    }

    const { data: services, error: serviceError } = await supabase
      .from('services')
      .select('id, title')
      .limit(1);

    if (serviceError) {
      console.error('❌ Service fetch error:', serviceError);
      return;
    }

    if (!customers?.length || !services?.length) {
      console.error('❌ Need at least one customer and one service');
      return;
    }

    console.log(`✅ Using customer: ${customers[0].business_name}`);
    console.log(`✅ Using service: ${services[0].title}`);

    // Get next job number from counters using database function
    console.log('🔍 Getting next job number...');
    const { data: nextJobNumber, error: counterError } = await supabase.rpc(
      "get_next_counter",
      { counter_name: "job" },
    );

    if (counterError) {
      console.error("❌ Error fetching next job counter:", counterError);
      return;
    }

    console.log('✅ Got next job number:', nextJobNumber);
    
    // Generate formatted job number with human-readable format
    const jobNumber = `JKDP-JOB-${String(nextJobNumber).padStart(4, "0")}`;
    console.log('📋 Job number:', jobNumber);
    
    // Create job record matching the ACTUAL database schema
    const jobData = {
      id: require('crypto').randomUUID(),
      jobNo: jobNumber,
      customer_id: customers[0].id,
      service_id: services[0].id,
      customerName: customers[0].business_name,
      serviceName: services[0].title,
      title: "Test Job - Fixed Submission",
      description: "Test description for fixed submission",
      status: "pending",
      priority: "normal",
      quantity: 2,
      estimate_price: 200,  // Correct column name
      estimated_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      unit_price: 100,
      job_type: "other",
      submittedDate: new Date().toISOString(),
      createdBy: "test-user",
    };

    console.log('📋 Job data to insert:', JSON.stringify(jobData, null, 2));

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert([jobData])
      .select()
      .single();

    if (jobError) {
      console.error("❌ Job creation error details:", {
        message: jobError.message,
        code: jobError.code,
        details: jobError.details,
        hint: jobError.hint,
      });
    } else {
      console.log('✅ Job creation successful!');
      console.log('📋 Created job:', job);
      
      // Clean up
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

testFixedJobSubmission().catch(console.error);