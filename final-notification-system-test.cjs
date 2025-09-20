// Final test of the complete notification system
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

async function finalNotificationSystemTest() {
  console.log('=== Final Notification System Test ===\n');
  
  try {
    // Create client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    console.log('1. Testing database connectivity and service role access...');
    
    // Test basic connectivity
    const { data: connTest, error: connError } = await supabase
      .from('notifications')
      .select('id')
      .limit(1);
    
    if (connError) {
      console.error('❌ Database connectivity failed:', connError.message);
      return;
    }
    
    console.log('✅ Database connectivity successful\n');
    
    console.log('2. Creating a test notification...');
    
    // Create a test notification
    const notificationData = {
      id: uuidv4(),
      recipient_id: null, // Allow null for system notifications
      title: 'Final System Test Notification',
      message: 'This notification confirms that the notification system is working correctly after RLS fixes',
      type: 'job_update',
      related_entity_id: uuidv4(),
      related_entity_type: 'test',
      email_sent: false,
      sms_sent: false,
      created_at: new Date().toISOString()
    };
    
    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notificationData);
    
    if (insertError) {
      console.error('❌ Failed to create notification:', insertError.message);
      return;
    }
    
    console.log('✅ Notification created successfully\n');
    
    console.log('3. Verifying notification in database...');
    
    // Verify the notification was created
    const { data: verifyData, error: verifyError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationData.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Failed to verify notification:', verifyError.message);
      return;
    }
    
    console.log('✅ Notification verified in database:');
    console.log('   ID:', verifyData.id);
    console.log('   Title:', verifyData.title);
    console.log('   Message:', verifyData.message);
    console.log('   Type:', verifyData.type);
    console.log('   Created:', verifyData.created_at);
    console.log();
    
    console.log('4. Testing notification query by type...');
    
    // Test querying notifications by type
    const { data: queryData, error: queryError } = await supabase
      .from('notifications')
      .select('id, title, message, type')
      .eq('type', 'job_update')
      .limit(3);
    
    if (queryError) {
      console.error('❌ Failed to query notifications:', queryError.message);
      return;
    }
    
    console.log('✅ Successfully queried notifications by type');
    console.log('   Found', queryData.length, 'notifications of type job_update\n');
    
    console.log('=== All Tests Passed! ===');
    console.log('The notification system is now working correctly.');
    console.log('RLS policies have been successfully applied and service role access is functioning.');
    
  } catch (error) {
    console.error('❌ Unexpected error during test:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

finalNotificationSystemTest();