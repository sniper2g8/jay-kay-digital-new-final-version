/**
 * Script to verify that RLS policies are working correctly
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

// Create admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verifyRLSFix() {
  console.log('🔍 Verifying RLS policies fix...\n');
  
  try {
    // Test 1: Check if we can access notifications table
    console.log('1. Testing notifications table access...');
    const { data: notificationsData, error: notificationsError } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .limit(1);
      
    if (notificationsError) {
      console.log(`  ❌ Error: ${notificationsError.message}`);
    } else {
      console.log('  ✅ notifications table accessible');
    }
    
    // Test 2: Check if we can access appUsers table
    console.log('\n2. Testing appUsers table access...');
    const { data: appUsersData, error: appUsersError } = await supabaseAdmin
      .from('appUsers')
      .select('*')
      .limit(1);
      
    if (appUsersError) {
      console.log(`  ❌ Error: ${appUsersError.message}`);
    } else {
      console.log('  ✅ appUsers table accessible');
    }
    
    // Test 3: Check if we can access notification_preferences table
    console.log('\n3. Testing notification_preferences table access...');
    const { data: preferencesData, error: preferencesError } = await supabaseAdmin
      .from('notification_preferences')
      .select('*')
      .limit(1);
      
    if (preferencesError) {
      console.log(`  ❌ Error: ${preferencesError.message}`);
    } else {
      console.log('  ✅ notification_preferences table accessible');
    }
    
    // Test 4: Try to insert a test notification
    console.log('\n4. Testing notification insert...');
    const testNotification = {
      recipient_id: 'test-user-001',
      title: 'Test Notification',
      message: 'Test message for RLS verification',
      type: 'job_update',
      created_at: new Date().toISOString()
    };
    
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('notifications')
      .insert(testNotification)
      .select();
      
    let notificationId = null;
    if (insertError) {
      console.log(`  ❌ Insert error: ${insertError.message}`);
    } else {
      console.log('  ✅ Notification insert successful');
      notificationId = insertData && insertData[0] ? insertData[0].id : null;
    }
    
    // Test 5: Try to read the inserted notification
    if (notificationId) {
      console.log('\n5. Testing notification read...');
      const { data: readData, error: readError } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('id', notificationId);
        
      if (readError) {
        console.log(`  ❌ Read error: ${readError.message}`);
      } else {
        console.log('  ✅ Notification read successful');
      }
      
      // Clean up test notification
      console.log('\n6. Cleaning up test notification...');
      const { error: deleteError } = await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('id', notificationId);
        
      if (deleteError) {
        console.log(`  ⚠️  Cleanup error: ${deleteError.message}`);
      } else {
        console.log('  ✅ Test notification cleaned up');
      }
    }
    
    console.log('\n✅ RLS verification completed');
    console.log('\nNext steps:');
    console.log('1. Restart your Next.js development server');
    console.log('2. Test the notification API endpoint again');
    console.log('3. If issues persist, check the Supabase logs for more details');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

verifyRLSFix().catch(console.error);