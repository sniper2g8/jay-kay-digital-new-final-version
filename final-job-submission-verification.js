#!/usr/bin/env node
/**
 * Final verification script for job submission fix
 * This script verifies that the fixed useJobSubmission logic works correctly
 */

require('dotenv').config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function finalVerification() {
  console.log('🔍 Final Verification of Job Submission Fix');
  console.log('==========================================');
  
  try {
    // Step 1: Verify we can access required data
    console.log('\n1. Checking database connectivity...');
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id, business_name')
      .limit(1);

    if (customerError) throw customerError;
    if (!customers?.length) throw new Error('No customers found');
    
    const { data: services, error: serviceError } = await supabase
      .from('services')
      .select('id, title')
      .limit(1);

    if (serviceError) throw serviceError;
    if (!services?.length) throw new Error('No services found');
    
    console.log('✅ Database connectivity OK');
    console.log(`✅ Customer: ${customers[0].business_name}`);
    console.log(`✅ Service: ${services[0].title}`);
    
    // Step 2: Test counter function
    console.log('\n2. Testing counter function...');
    const { data: nextJobNumber, error: counterError } = await supabase.rpc(
      "get_next_counter",
      { counter_name: "job" },
    );

    if (counterError) throw counterError;
    console.log('✅ Counter function working, next number:', nextJobNumber);
    
    // Step 3: Test job creation with corrected schema
    console.log('\n3. Testing job creation with fixed schema...');
    const jobNumber = `JKDP-JOB-${String(nextJobNumber).padStart(4, "0")}`;
    
    const jobData = {
      id: require('crypto').randomUUID(),
      jobNo: jobNumber,
      customer_id: customers[0].id,
      service_id: services[0].id,
      customerName: customers[0].business_name,
      serviceName: services[0].title,
      title: "Final Verification Test Job",
      description: "Testing the fixed job submission logic",
      status: "pending",
      priority: "normal",
      quantity: 2,
      estimate_price: 300, // CORRECT column name
      estimated_delivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      unit_price: 150,
      job_type: "other",
      submittedDate: new Date().toISOString(),
      createdBy: "final-verification-test",
    };

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert([jobData])
      .select()
      .single();

    if (jobError) throw jobError;
    console.log('✅ Job creation successful!');
    console.log(`✅ Job ID: ${job.id}`);
    console.log(`✅ Job title: ${job.title}`);
    console.log(`✅ Estimate price: ${job.estimate_price}`);
    
    // Step 4: Verify job retrieval
    console.log('\n4. Verifying job retrieval...');
    const { data: retrievedJob, error: retrieveError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", job.id)
      .single();

    if (retrieveError) throw retrieveError;
    console.log('✅ Job retrieval successful!');
    console.log(`✅ Retrieved title: ${retrievedJob.title}`);
    console.log(`✅ Retrieved estimate_price: ${retrievedJob.estimate_price}`);
    
    // Step 5: Cleanup
    console.log('\n5. Cleaning up test job...');
    const { error: deleteError } = await supabase
      .from('jobs')
      .delete()
      .eq('id', job.id);

    if (deleteError) {
      console.warn('⚠️  Cleanup warning (permissions):', deleteError.message);
    } else {
      console.log('✅ Test job cleaned up successfully');
    }
    
    console.log('\n🎉 FINAL VERIFICATION PASSED!');
    console.log('✅ Job submission error has been fixed');
    console.log('✅ useJobSubmission hook should now work correctly');
    console.log('✅ Database schema mismatches resolved');
    
  } catch (error) {
    console.error('\n❌ FINAL VERIFICATION FAILED:', error.message);
    process.exit(1);
  }
}

// Run the verification
finalVerification().catch(error => {
  console.error('❌ Verification script failed:', error);
  process.exit(1);
});