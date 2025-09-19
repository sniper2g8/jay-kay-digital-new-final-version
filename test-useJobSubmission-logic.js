require('dotenv').config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Mock form data that would come from the form
const mockFormData = {
  customer_id: '',
  service_id: '',
  title: 'Test Job from Form',
  description: 'Test job description',
  priority: 'normal',
  quantity: 3,
  unit_price: 75,
  due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
  // These would normally come from form fields
  requirements: 'Test requirements',
  special_instructions: 'Test special instructions',
  size_type: 'standard',
  size_preset: 'A4',
  paper_type: 'matte',
  paper_weight: '150gsm',
  finishing_options: []
};

async function testUseJobSubmissionLogic() {
  try {
    console.log('🧪 Testing useJobSubmission.ts logic...');
    console.log('=====================================');

    // Get test data
    console.log('\n1. 🔍 Getting test customer and service...');
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

    // Update form data with real IDs
    mockFormData.customer_id = customers[0].id;
    mockFormData.service_id = services[0].id;
    
    console.log(`✅ Customer: ${customers[0].business_name}`);
    console.log(`✅ Service: ${services[0].title}`);

    // Get next job number
    console.log('\n2. 🔢 Getting next job number...');
    const { data: nextJobNumber, error: counterError } = await supabase.rpc(
      "get_next_counter",
      { counter_name: "job" },
    );

    if (counterError) {
      console.error("❌ Counter error:", counterError);
      return;
    }

    console.log('✅ Got next job number:', nextJobNumber);
    
    // Generate formatted job number
    const jobNumber = `JKDP-JOB-${String(nextJobNumber).padStart(4, "0")}`;
    console.log('📋 Job number:', jobNumber);
    
    // Mock estimated price and finishing options (would come from form calculations)
    const estimatedPrice = 225; // 3 quantity * 75 unit_price
    const finishingOptionPrices = {};
    
    // Create job record exactly as useJobSubmission.ts does (FIXED VERSION)
    console.log('\n3. 📝 Creating job record...');
    
    const jobData = {
      id: require('crypto').randomUUID(),
      jobNo: jobNumber,
      customer_id: mockFormData.customer_id,
      service_id: mockFormData.service_id,
      customerName: customers[0].business_name,
      serviceName: services[0].title,
      title: mockFormData.title,
      description: mockFormData.description || null,
      status: "pending",
      priority: mockFormData.priority,
      quantity: mockFormData.quantity,
      estimate_price: estimatedPrice, // Use correct column name
      estimated_delivery: mockFormData.due_date || null,
      unit_price: mockFormData.unit_price || null,
      job_type: "other", // Safe default
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
      console.error("❌ Job creation error:", {
        message: jobError.message,
        code: jobError.code,
        details: jobError.details,
        hint: jobError.hint,
      });
      return;
    }

    console.log('✅ Job created successfully!');
    console.log('📋 Job ID:', job.id);
    console.log('📋 Job title:', job.title);
    console.log('📋 Estimate price:', job.estimate_price);
    
    // Test file attachment if needed
    console.log('\n4. 📎 Testing file attachment (if any)...');
    // In the actual hook, this would be handled by uploadedFileRecords parameter
    
    // Clean up
    console.log('\n5. 🧹 Cleaning up test job...');
    const { error: deleteError } = await supabase
      .from('jobs')
      .delete()
      .eq('id', job.id);

    if (deleteError) {
      console.error("❌ Cleanup failed:", deleteError);
    } else {
      console.log('✅ Test job cleaned up successfully');
    }

    console.log('\n🎉 useJobSubmission.ts logic test PASSED!');
    console.log('The fixed hook should now work correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testUseJobSubmissionLogic().catch(console.error);