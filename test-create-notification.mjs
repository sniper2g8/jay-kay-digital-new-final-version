/**
 * Test the exact same createNotification method from notification-service.ts
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

// Replicate the exact same createServiceRoleClient function
const createServiceRoleClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};

async function testCreateNotification() {
  console.log('Testing createNotification method...\n');
  
  try {
    // Replicate the exact same logic as in createNotification method
    const adminSupabase = createServiceRoleClient();
    
    const testData = {
      recipient_id: 'test-user-123',
      title: 'Test Notification',
      message: 'Test message from createNotification test',
      type: 'job_update',
      related_entity_id: 'test-entity-123',
      related_entity_type: 'job',
      email_sent: false,
      sms_sent: false,
      created_at: new Date().toISOString()
    };
    
    console.log('Inserting test notification...');
    const { error } = await adminSupabase
      .from('notifications')
      .insert(testData);

    if (error) {
      console.log(`  ❌ Error: ${error.message}`);
      console.log(`  Code: ${error.code}`);
      return;
    }
    
    console.log('  ✅ Notification inserted successfully');
    
    // Try to read it back
    console.log('\nReading notification back...');
    const { data, error: readError } = await adminSupabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', 'test-user-123')
      .limit(1);
      
    if (readError) {
      console.log(`  ❌ Read error: ${readError.message}`);
      return;
    }
    
    console.log('  ✅ Notification read successfully');
    console.log(`  Retrieved ${data.length} records`);
    
    // Clean up
    if (data && data.length > 0) {
      console.log('\nCleaning up test notification...');
      const { error: deleteError } = await adminSupabase
        .from('notifications')
        .delete()
        .eq('id', data[0].id);
        
      if (deleteError) {
        console.log(`  ⚠️  Cleanup error: ${deleteError.message}`);
      } else {
        console.log('  ✅ Test notification cleaned up');
      }
    }
    
    console.log('\n🎉 createNotification test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCreateNotification().catch(console.error);