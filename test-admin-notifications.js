require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function fixNotificationPermissions() {
  try {
    console.log('🔧 Using Supabase Admin client to fix permissions...');

    // Test admin access first
    console.log('\n=== Testing admin access ===');
    const { data: adminTest, error: adminError } = await supabaseAdmin
      .from('notifications')
      .select('count')
      .limit(1);

    if (adminError) {
      console.error('Admin access failed:', adminError);
      return;
    }
    console.log('✅ Admin access works');

    // Try creating a test notification using admin client
    console.log('\n=== Testing notification creation with admin client ===');
    const testNotification = {
      id: crypto.randomUUID(),
      recipient_id: 'test-user-id',
      title: 'Admin Test Notification',
      message: 'Testing admin permissions',
      type: 'info',
      created_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('notifications')
      .insert([testNotification])
      .select()
      .single();

    if (insertError) {
      console.error('Admin notification insertion failed:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      });
    } else {
      console.log('✅ Admin notification insertion successful');
      console.log('Inserted notification ID:', insertData?.id);
      
      // Clean up test notification
      await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('id', insertData.id);
      console.log('🧹 Cleaned up test notification');
    }

    // Test regular client again
    console.log('\n=== Testing regular client ===');
    const supabaseRegular = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY);
    
    const { data: regularData, error: regularError } = await supabaseRegular
      .from('notifications')
      .select('count')
      .limit(1);

    if (regularError) {
      console.error('Regular client failed:', {
        message: regularError.message,
        code: regularError.code,
        details: regularError.details,
        hint: regularError.hint
      });
      
      console.log('\n💡 Solution: The issue is RLS policies blocking non-authenticated users');
      console.log('💡 For notifications to work, users need to be properly authenticated');
      console.log('💡 Or we need to use the admin client for notification operations');
    } else {
      console.log('✅ Regular client can access notifications');
    }

  } catch (error) {
    console.error('Operation failed:', error);
  }
}

fixNotificationPermissions().catch(console.error);