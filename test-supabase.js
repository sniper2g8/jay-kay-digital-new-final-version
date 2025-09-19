import { createClient } from '@supabase/supabase-js';;
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection and permissions...');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '[SET]' : '[NOT SET]');
  
  try {
    // Test notifications table access
    console.log('\n=== Testing notifications table ===');
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .limit(5);
    
    if (notifError) {
      console.log('❌ Notifications error:', notifError);
    } else {
      console.log('✅ Notifications accessible:', notifications.length, 'records');
    }
    
    // Test jobs table access
    console.log('\n=== Testing jobs table ===');
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .limit(5);
    
    if (jobsError) {
      console.log('❌ Jobs error:', jobsError);
    } else {
      console.log('✅ Jobs accessible:', jobs.length, 'records');
    }
    
    // Test customers table access
    console.log('\n=== Testing customers table ===');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(5);
    
    if (customersError) {
      console.log('❌ Customers error:', customersError);
    } else {
      console.log('✅ Customers accessible:', customers.length, 'records');
    }
    
    // Test counter function
    console.log('\n=== Testing get_next_counter function ===');
    const { data: counterResult, error: counterError } = await supabase
      .rpc('get_next_counter', { counter_name: 'job' });
    
    if (counterError) {
      console.log('❌ Counter function error:', counterError);
    } else {
      console.log('✅ Counter function works:', counterResult);
    }
    
    // Test with anon key (what the frontend uses)
    console.log('\n=== Testing with anon key (frontend simulation) ===');
    const anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const { data: anonNotifications, error: anonError } = await anonSupabase
      .from('notifications')
      .select('*')
      .limit(1);
    
    if (anonError) {
      console.log('❌ Anon key notifications error:', anonError);
    } else {
      console.log('✅ Anon key notifications work:', anonNotifications.length, 'records');
    }
    
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
  }
}

testSupabaseConnection();