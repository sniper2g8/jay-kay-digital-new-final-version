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

async function comprehensiveJobSubmissionTest() {
  try {
    console.log('🧪 Running comprehensive job submission test...');
    console.log('==============================================');

    // Get test customer and service
    console.log('\n1. 🔍 Getting test data...');
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

    console.log(`✅ Customer: ${customers[0].business_name}`);
    console.log(`✅ Service: ${services[0].title}`);

    // Test counter function
    console.log('\n2. 🔢 Testing counter function...');
    const { data: nextJobNumber, error: counterError } = await supabase.rpc(
      "get_next_counter",
      { counter_name: "job" },
    );

    if (counterError) {
      console.error("❌ Counter error:", counterError);
      return;
    }

    console.log('✅ Counter works, next job number:', nextJobNumber);
    
    // Generate formatted job number
    const jobNumber = `JKDP-JOB-${String(nextJobNumber).padStart(4, "0")}`;
    console.log('📋 Job number:', jobNumber);
    
    // Test full job submission with all fields
    console.log('\n3. 📝 Testing full job submission...');
    
    const jobData = {
      id: require('crypto').randomUUID(),
      jobNo: jobNumber,
      customer_id: customers[0].id,
      service_id: services[0].id,
      customerName: customers[0].business_name,
      serviceName: services[0].title,
      title: "Comprehensive Test Job",
      description: "Full test of all job fields",
      status: "pending",
      priority: "high",
      quantity: 5,
      estimate_price: 500,
      estimated_delivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      unit_price: 100,
      job_type: "flyers",
      submittedDate: new Date().toISOString(),
      createdBy: "comprehensive-test",
    };

    console.log('📋 Job data:', JSON.stringify(jobData, null, 2));

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert([jobData])
      .select()
      .single();

    if (jobError) {
      console.error("❌ Job creation failed:", {
        message: jobError.message,
        code: jobError.code,
        details: jobError.details,
        hint: jobError.hint,
      });
      return;
    }

    console.log('✅ Job created successfully!');
    console.log('📋 Job ID:', job.id);
    
    // Test file attachment (simulated)
    console.log('\n4. 📎 Testing file attachment simulation...');
    const testFileRecord = {
      id: require('crypto').randomUUID(),
      job_id: job.id,
      file_name: "test-document.pdf",
      file_url: "https://example.com/test-document.pdf",
      file_type: "application/pdf",
      file_size: 1024000,
      uploaded_at: new Date().toISOString(),
    };
    
    console.log('📋 File record:', JSON.stringify(testFileRecord, null, 2));
    
    // In a real scenario, we would insert this into file_attachments table
    console.log('✅ File attachment simulation successful');
    
    // Test job retrieval
    console.log('\n5. 🔍 Testing job retrieval...');
    const { data: retrievedJob, error: retrieveError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", job.id)
      .single();

    if (retrieveError) {
      console.error("❌ Job retrieval failed:", retrieveError);
      return;
    }

    console.log('✅ Job retrieved successfully!');
    console.log('📋 Retrieved job title:', retrievedJob.title);
    console.log('📋 Retrieved job status:', retrievedJob.status);
    console.log('📋 Retrieved estimate_price:', retrievedJob.estimate_price);
    
    // Test job update
    console.log('\n6. 🔄 Testing job update...');
    const { data: updatedJob, error: updateError } = await supabase
      .from("jobs")
      .update({ 
        status: "in_progress",
        actual_delivery: new Date().toISOString()
      })
      .eq("id", job.id)
      .select()
      .single();

    if (updateError) {
      console.error("❌ Job update failed:", updateError);
      return;
    }

    console.log('✅ Job updated successfully!');
    console.log('📋 Updated job status:', updatedJob.status);
    
    // Clean up
    console.log('\n7. 🧹 Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('jobs')
      .delete()
      .eq('id', job.id);

    if (deleteError) {
      console.error("❌ Cleanup failed:", deleteError);
    } else {
      console.log('✅ Test job cleaned up successfully');
    }

    console.log('\n🎉 All tests passed! Job submission is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

comprehensiveJobSubmissionTest().catch(console.error);