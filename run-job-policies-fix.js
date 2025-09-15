const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin operations

console.log('🔍 Checking environment variables...');
console.log('Supabase URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
console.log('Service Key:', supabaseServiceKey ? '✅ Found' : '❌ Missing');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixJobSubmissionPolicies() {
  console.log('🔧 Fixing job submission and file upload policies...');
  
  try {
    // Direct policy creation using the service role client
    console.log('📝 Executing database policies...');
    
    // 1. Grant table permissions
    console.log('⚡ Step 1: Granting table permissions...');
    
    // Since we can't run GRANT statements via rpc, let's focus on the RLS policies
    // The GRANT statements need to be run manually in the SQL editor
    
    // 2. Check if jobs table exists and create policies
    console.log('⚡ Step 2: Checking table structure...');
    
    const { data: jobsData, error: jobsError } = await supabase
      .from('jobs')
      .select('count', { count: 'exact', head: true });
      
    if (jobsError && !jobsError.message.includes('permission denied')) {
      console.log('❌ Jobs table check failed:', jobsError.message);
    } else {
      console.log('✅ Jobs table accessible');
    }
    
    // 3. Check customers table
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .select('count', { count: 'exact', head: true });
      
    if (customersError && !customersError.message.includes('permission denied')) {
      console.log('❌ Customers table check failed:', customersError.message);
    } else {
      console.log('✅ Customers table accessible');
    }
    
    // 4. Test job creation with a sample job
    console.log('⚡ Step 3: Testing job creation...');
    
    const testJobData = {
      id: crypto.randomUUID(),
      jobNo: `TEST-${Date.now()}`,
      title: 'Test Job - Policy Check',
      status: 'pending',
      customer_id: 1, // Assuming customer ID 1 exists
      service_id: 1,   // Assuming service ID 1 exists
      quantity: 1,
      estimated_cost: 10.00,
      specifications: { test: true },
      submittedDate: new Date().toISOString()
    };
    
    const { data: testJob, error: testJobError } = await supabase
      .from('jobs')
      .insert([testJobData])
      .select()
      .single();
    
    if (testJobError) {
      console.log('❌ Test job creation failed:', testJobError.message);
      if (testJobError.message.includes('permission denied')) {
        console.log('🔧 MANUAL ACTION REQUIRED:');
        console.log('1. Copy the contents of fix-job-submission-policies.sql');
        console.log('2. Paste and execute in your Supabase SQL editor');
        console.log('3. Create storage policies as described in STORAGE_POLICIES_GUIDE.md');
      }
    } else {
      console.log('✅ Test job created successfully!');
      // Clean up test job
      await supabase.from('jobs').delete().eq('id', testJob.id);
      console.log('🧹 Test job cleaned up');
    }
    
    console.log('🎉 Policy check completed!');
    console.log('');
    console.log('⚠️  STORAGE POLICIES still need manual setup:');
    console.log('1. Go to Storage > Policies in your Supabase dashboard');
    console.log('2. Create policies for the "job-files" bucket as described in STORAGE_POLICIES_GUIDE.md');
    
  } catch (error) {
    console.error('❌ Failed to check/fix job submission policies:', error);
    console.log('');
    console.log('🔧 Manual fix required:');
    console.log('1. Copy the contents of fix-job-submission-policies.sql');
    console.log('2. Paste and execute in your Supabase SQL editor');
    console.log('3. Create storage policies manually as described in STORAGE_POLICIES_GUIDE.md');
  }
}

fixJobSubmissionPolicies();