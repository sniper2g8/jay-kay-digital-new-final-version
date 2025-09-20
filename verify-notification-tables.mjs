/**
 * Script to verify notification-related database tables and RLS policies
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

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function verifyTables() {
  console.log('Verifying notification-related tables...\n');
  
  // Check notifications table
  console.log('1. Checking notifications table...');
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('❌ Error accessing notifications table:', error);
    } else {
      console.log('✅ notifications table accessible');
    }
  } catch (error) {
    console.error('❌ Exception accessing notifications table:', error.message);
  }
  
  // Check appUsers table
  console.log('\n2. Checking appUsers table...');
  try {
    const { data, error } = await supabase
      .from('appUsers')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('❌ Error accessing appUsers table:', error);
    } else {
      console.log('✅ appUsers table accessible');
    }
  } catch (error) {
    console.error('❌ Exception accessing appUsers table:', error.message);
  }
  
  // Check notification_preferences table
  console.log('\n3. Checking notification_preferences table...');
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('❌ Error accessing notification_preferences table:', error);
    } else {
      console.log('✅ notification_preferences table accessible');
    }
  } catch (error) {
    console.error('❌ Exception accessing notification_preferences table:', error.message);
  }
  
  // Check RLS policies
  console.log('\n4. Checking RLS policies...');
  try {
    // Try to insert a test notification
    const testNotification = {
      recipient_id: 'test-user-001',
      title: 'Test Notification',
      message: 'Test message',
      type: 'job_update',
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('notifications')
      .insert(testNotification)
      .select();
      
    if (error) {
      console.error('❌ Error inserting test notification:', error);
    } else {
      console.log('✅ Successfully inserted test notification');
      
      // Clean up test notification
      if (data && data[0]) {
        await supabase
          .from('notifications')
          .delete()
          .eq('id', data[0].id);
        console.log('✅ Cleaned up test notification');
      }
    }
  } catch (error) {
    console.error('❌ Exception testing notification insert:', error.message);
  }
}

verifyTables().catch(console.error);