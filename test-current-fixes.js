require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCurrentFunctionality() {
  try {
    console.log('🧪 Testing current Supabase functionality...');

    // Test 1: Job creation (should work now)
    console.log('\n=== Testing Job Creation ===');
    
    // Get test data
    const { data: customers } = await supabase
      .from('customers')
      .select('id, business_name')
      .limit(1);
      
    const { data: services } = await supabase
      .from('services')
      .select('id, title')
      .limit(1);

    if (!customers?.length || !services?.length) {
      console.error('Missing test data');
      return;
    }

    // Get next job number
    const { data: nextJobNumber, error: counterError } = await supabase.rpc(
      'get_next_counter',
      { counter_name: 'job' }
    );

    if (counterError) {
      console.error('❌ Counter function failed:', counterError);
    } else {
      console.log('✅ Counter function works, next job:', nextJobNumber);
    }

    // Test job creation with correct schema
    const jobNumber = `JKDP-JOB-${String(nextJobNumber).padStart(4, '0')}`;
    const testJobData = {
      id: crypto.randomUUID(),
      jobNo: jobNumber,
      customer_id: customers[0].id,
      service_id: services[0].id,
      title: 'Test Job - Schema Fixed',
      description: 'Testing with corrected column names',
      status: 'pending',
      priority: 'normal', // Using correct enum value
      quantity: 1,
      estimate_price: 150, // Using correct column name
      submittedDate: new Date().toISOString(),
      createdBy: 'test-user-system'
    };

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert([testJobData])
      .select()
      .single();

    if (jobError) {
      console.error('❌ Job creation failed:', jobError);
    } else {
      console.log('✅ Job creation successful! ID:', job.id);
      
      // Try to delete for cleanup (might fail due to RLS)
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

    // Test 2: Notification permissions
    console.log('\n=== Testing Notification Access ===');
    
    const { data: notificationCount, error: notificationError } = await supabase
      .from('notifications')
      .select('count', { count: 'exact', head: true });

    if (notificationError) {
      console.error('❌ Notification access failed:', notificationError);
      console.log('💡 This explains the "Error getting unread count: {}" issue');
    } else {
      console.log('✅ Notification access works');
    }

    // Test 3: Real-time subscription setup
    console.log('\n=== Testing Real-time Capabilities ===');
    
    const testChannel = supabase
      .channel('test-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'jobs'
      }, (payload) => {
        console.log('Real-time event:', payload);
      });
    
    const subscriptionResult = await testChannel.subscribe();
    console.log('Real-time subscription status:', subscriptionResult);
    
    // Clean up
    supabase.removeChannel(testChannel);

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testCurrentFunctionality().catch(console.error);