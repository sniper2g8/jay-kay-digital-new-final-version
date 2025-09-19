require('dotenv').config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testActualJobSubmission() {
  try {
    console.log('🧪 Testing actual job submission (matching useJobSubmission.ts)...');

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
    
    // Prepare specifications with all details including finishing options
    const specifications = {
      requirements: "Test requirements",
      special_instructions: "Test special instructions",
      unit_price: 50,
      size: {
        type: "standard",
        preset: "A4"
      },
      paper: {
        type: "glossy",
        weight: "200gsm",
      },
      finishing: {
        selected_finish_ids: [],
        finish_prices: {},
        total_finishing_cost: 0,
      },
    };

    // Create job record matching the actual database schema
    const jobData = {
      id: require('crypto').randomUUID(),
      jobNo: jobNumber,
      customer_id: customers[0].id,
      service_id: services[0].id,
      title: "Test Job from useJobSubmission.ts",
      description: "Test description",
      status: "pending",
      priority: "normal",
      quantity: 2,
      estimated_cost: 200,  // This might be the issue - should be estimate_price?
      estimated_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      specifications: specifications,
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

      // Try with the correct column name
      console.log('\n🔄 Trying with estimate_price instead of estimated_cost...');
      const correctedJobData = {
        ...jobData,
        estimate_price: jobData.estimated_cost,  // Use correct column name
        estimated_cost: undefined  // Remove incorrect column
      };
      
      delete correctedJobData.estimated_cost;

      console.log('📋 Corrected job data:', JSON.stringify(correctedJobData, null, 2));

      const { data: correctedJob, error: correctedError } = await supabase
        .from("jobs")
        .insert([correctedJobData])
        .select()
        .single();

      if (correctedError) {
        console.error("❌ Corrected job creation still failed:", {
          message: correctedError.message,
          code: correctedError.code,
          details: correctedError.details,
          hint: correctedError.hint,
        });
      } else {
        console.log('✅ Corrected job creation successful!');
        console.log('📋 Created job:', correctedJob);
        
        // Clean up
        await supabase
          .from('jobs')
          .delete()
          .eq('id', correctedJob.id);
        console.log('🧹 Cleaned up test job');
      }
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

testActualJobSubmission().catch(console.error);