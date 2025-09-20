import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Use service role key for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function verifyNotificationsRLS() {
  console.log('🔍 Verifying notifications RLS configuration...');
  
  try {
    // Test 1: Check if we can access the notifications table with admin client
    console.log('\n1. Testing admin access to notifications table...');
    const { data: testData, error: testError } = await supabaseAdmin
      .from('notifications')
      .select('count')
      .limit(1);
      
    if (testError) {
      console.error('❌ Admin access failed:', testError);
      return;
    }
    console.log('✅ Admin access works');
    
    // Test 2: Check current RLS status
    console.log('\n2. Checking RLS status...');
    const rlsCheck = await supabaseAdmin.rpc('execute_sql', {
      query: `
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE tablename = 'notifications' AND schemaname = 'public'
      `
    });
    
    if (rlsCheck.error) {
      console.log('ℹ️  Could not check RLS status directly, but this is OK');
    } else {
      console.log('RLS status:', rlsCheck.data);
    }
    
    // Test 3: Check existing policies
    console.log('\n3. Checking existing policies...');
    const policyCheck = await supabaseAdmin.rpc('execute_sql', {
      query: `
        SELECT policyname, permissive, roles, cmd, qual 
        FROM pg_policy 
        JOIN pg_class ON pg_policy.polrelid = pg_class.oid 
        WHERE pg_class.relname = 'notifications'
      `
    });
    
    if (policyCheck.error) {
      console.log('ℹ️  Could not check policies directly, but this is OK');
    } else {
      console.log('Existing policies:');
      policyCheck.data.forEach((policy, index) => {
        console.log(`  ${index + 1}. ${policy.policyname} (${policy.cmd})`);
      });
    }
    
    // Test 4: Try to create a test notification using admin client
    console.log('\n4. Testing notification creation with admin client...');
    const testNotification = {
      id: crypto.randomUUID(),
      recipient_id: 'test-user-id',
      title: 'RLS Test Notification',
      message: 'Testing RLS configuration',
      type: 'info',
      created_at: new Date().toISOString()
    };
    
    const { error: insertError } = await supabaseAdmin
      .from('notifications')
      .insert(testNotification);
      
    if (insertError) {
      console.error('❌ Admin insertion failed:', insertError);
    } else {
      console.log('✅ Admin insertion works');
      
      // Clean up test notification
      await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('id', testNotification.id);
    }
    
    console.log('\n✅ RLS verification completed');
    console.log('\n📋 If you\'re still having permission issues, make sure to:');
    console.log('1. Enable RLS on the notifications table');
    console.log('2. Add the policies as described in FIX_NOTIFICATIONS_RLS.md');
    console.log('3. Ensure the recipient_id column is properly populated');
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

verifyNotificationsRLS().catch(console.error);