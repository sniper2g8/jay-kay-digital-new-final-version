// Test notification creation with valid UUID format
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

async function testNotificationWithValidUUIDs() {
  console.log('Testing notification creation with valid UUIDs...');
  
  try {
    // Create client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // First, let's try to get an existing user ID
    console.log('Getting existing user ID...');
    const { data: userData, error: userError } = await supabase
      .from('appUsers')
      .select('id')
      .limit(1);
    
    console.log('User data:', userData);
    console.log('User error:', userError);
    
    let recipientId;
    
    if (userError || !userData || userData.length === 0) {
      console.log('No existing users found or error accessing users');
      // Just test with a null recipient_id for now
      recipientId = null;
    } else {
      recipientId = userData[0].id;
      console.log('✅ Using existing user ID:', recipientId);
    }
    
    // Generate valid UUIDs
    const relatedEntityId = uuidv4();
    const notificationId = uuidv4();
    
    console.log('Using generated UUIDs:');
    console.log('  Recipient ID:', recipientId);
    console.log('  Related Entity ID:', relatedEntityId);
    console.log('  Notification ID:', notificationId);
    
    // Test read access first
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
    
    // Test insert with valid UUIDs
    const testData = {
      id: notificationId,
      recipient_id: recipientId,
      title: 'Test Notification with Valid UUIDs',
      message: 'This is a test notification with properly formatted UUIDs',
      type: 'job_update',
      related_entity_id: relatedEntityId,
      related_entity_type: 'job',
      email_sent: false,
      sms_sent: false,
      created_at: new Date().toISOString()
    };
    
    console.log('Testing insert with valid UUIDs...');
    const { data, error } = await supabase
      .from('notifications')
      .insert(testData);
    
    if (error) {
      console.error('❌ Error inserting notification:', error.message);
      console.error('Error code:', error.code);
      return;
    }
    
    console.log('✅ Notification inserted successfully with valid UUIDs');
    
    // Verify the notification was inserted
    console.log('Verifying insertion...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single();
    
    if (verifyError) {
      console.error('❌ Error verifying notification:', verifyError.message);
      return;
    }
    
    console.log('✅ Notification verified in database:');
    console.log('  Title:', verifyData.title);
    console.log('  Message:', verifyData.message);
    console.log('  Type:', verifyData.type);
    
  } catch (error) {
    console.error('❌ Exception occurred:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testNotificationWithValidUUIDs();