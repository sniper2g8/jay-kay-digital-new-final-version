require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableSchemas() {
  try {
    console.log('🔍 Checking table schemas...');

    // Check customers table
    console.log('\n=== Customers table ===');
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .limit(1);
    
    if (customerError) {
      console.error('Customer error:', customerError);
    } else {
      console.log('Customer sample columns:', customers[0] ? Object.keys(customers[0]) : 'No data');
    }

    // Check services table
    console.log('\n=== Services table ===');
    const { data: services, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .limit(1);
    
    if (serviceError) {
      console.error('Service error:', serviceError);
    } else {
      console.log('Service sample columns:', services[0] ? Object.keys(services[0]) : 'No data');
    }

    // Check jobs table
    console.log('\n=== Jobs table ===');
    const { data: jobs, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .limit(1);
    
    if (jobError) {
      console.error('Job error:', jobError);
    } else {
      console.log('Job sample columns:', jobs[0] ? Object.keys(jobs[0]) : 'No data');
    }

    // Check notifications table
    console.log('\n=== Notifications table ===');
    const { data: notifications, error: notificationError } = await supabase
      .from('notifications')
      .select('*')
      .limit(1);
    
    if (notificationError) {
      console.error('Notification error:', notificationError);
    } else {
      console.log('Notification sample columns:', notifications[0] ? Object.keys(notifications[0]) : 'No data');
    }

  } catch (error) {
    console.error('Schema check failed:', error);
  }
}

checkTableSchemas().catch(console.error);