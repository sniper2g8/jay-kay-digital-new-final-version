require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFileAttachmentFix() {
  try {
    console.log('🧪 Testing file attachment fix...');
    console.log('================================');

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
    
    // Create job record
    console.log('\n3. 📝 Creating test job...');
    const jobData = {
      id: require('crypto').randomUUID(),
      jobNo: jobNumber,
      customer_id: customers[0].id,
      service_id: services[0].id,
      customerName: customers[0].business_name,
      serviceName: services[0].title,
      title: "File Attachment Test Job",
      description: "Testing file attachment fix",
      status: "pending",
      priority: "normal",
      quantity: 1,
      estimate_price: 100,
      estimated_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      unit_price: 100,
      job_type: "other",
      submittedDate: new Date().toISOString(),
      createdBy: "file-attachment-test",
    };

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
    
    // Test file attachment with CORRECTED structure
    console.log('\n4. 📎 Testing file attachment with fixed structure...');
    const testFileRecords = [{
      id: require('crypto').randomUUID(),
      entity_id: job.id,        // Use entity_id instead of job_id
      entity_type: "job",       // Specify entity type
      file_name: "test-document.pdf",
      file_type: "application/pdf",
      file_size: 1024000,
      file_url: "https://example.com/test-document.pdf",
      thumbnail_url: null,
      is_primary: false,
      // Don't set uploaded_by to avoid foreign key constraint issues
      created_at: new Date().toISOString(),
    }];

    console.log('📋 File attachment data:', JSON.stringify(testFileRecords[0], null, 2));

    const { error: filesError } = await supabase
      .from("file_attachments")
      .insert(testFileRecords);

    if (filesError) {
      console.error("❌ File attachment failed:", {
        message: filesError.message,
        code: filesError.code,
        details: filesError.details,
        hint: filesError.hint,
      });
      return;
    }

    console.log('✅ File attachment successful!');
    
    // Verify file attachment was created
    console.log('\n5. 🔍 Verifying file attachment...');
    const { data: attachedFiles, error: verifyError } = await supabase
      .from("file_attachments")
      .select("*")
      .eq("entity_id", job.id);

    if (verifyError) {
      console.error("❌ File verification failed:", verifyError);
      return;
    }

    if (attachedFiles && attachedFiles.length > 0) {
      console.log('✅ File attachment verified!');
      console.log(`📋 Attached file: ${attachedFiles[0].file_name}`);
      console.log(`📋 Entity type: ${attachedFiles[0].entity_type}`);
    } else {
      console.log('❌ No file attachments found');
      return;
    }
    
    // Clean up
    console.log('\n6. 🧹 Cleaning up test data...');
    // Clean up file attachments first
    const { error: fileDeleteError } = await supabase
      .from('file_attachments')
      .delete()
      .eq('entity_id', job.id);
      
    if (fileDeleteError) {
      console.warn('⚠️  File cleanup warning:', fileDeleteError.message);
    } else {
      console.log('✅ File attachments cleaned up');
    }
    
    // Clean up job (may fail due to permissions)
    const { error: jobDeleteError } = await supabase
      .from('jobs')
      .delete()
      .eq('id', job.id);
      
    if (jobDeleteError) {
      console.warn('⚠️  Job cleanup warning (permissions):', jobDeleteError.message);
    } else {
      console.log('✅ Test job cleaned up');
    }

    console.log('\n🎉 FILE ATTACHMENT FIX VERIFICATION PASSED!');
    console.log('✅ File attachments now use correct entity_id and entity_type columns');
    console.log('✅ useJobSubmission hook should work correctly with file attachments');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFileAttachmentFix().catch(console.error);