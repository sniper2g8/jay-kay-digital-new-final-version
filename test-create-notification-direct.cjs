// Direct test of createNotification method
require('dotenv').config({ path: '.env.local' });

// Since we can't easily import TypeScript modules in CommonJS, let's test the Supabase client directly
const { createClient } = require('@supabase/supabase-js');

async function testCreateNotification() {
  console.log('Testing Supabase client with service role key...');
  
  try {
    // Create client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // First, let's check if we can read from the notifications table
    console.log('Testing read access...');
    const { data: readData, error: readError } = await supabase
      .from('notifications')
      .select('id')
      .limit(1);
    
    if (readError) {
      console.error('❌ Error reading notifications:', readError.message);
      return;
    }
    
    console.log('✅ Read access successful');
    
    // Now let's try to insert a notification without a recipient_id (which should be allowed)
    const testData = {
      title: 'Test Notification',
      message: 'This is a test notification',
      type: 'job_update',
      related_entity_id: 'test-job-001',
      related_entity_type: 'job',
      email_sent: false,
      sms_sent: false,
      created_at: new Date().toISOString()
    };
    
    console.log('Testing insert access...');
    const { data, error } = await supabase
      .from('notifications')
      .insert(testData);
    
    if (error) {
      console.error('❌ Error inserting notification:', error.message);
      console.error('Error code:', error.code);
      return;
    }
    
    console.log('✅ Notification inserted successfully');
    console.log('Data:', data);
  } catch (error) {
    console.error('❌ Exception occurred:', error.message);
  }
}

testCreateNotification();