// Simple test script to verify service role access
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testServiceRoleAccess() {
  console.log('Testing service role access...');
  
  // Create client with service role key
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  console.log('Client created with service role key');
  
  try {
    // Try to access the notifications table
    console.log('Testing notifications table access...');
    const { data: notificationsData, error: notificationsError } = await supabase
      .from('notifications')
      .select('id')
      .limit(1);
      
    if (notificationsError) {
      console.error('❌ Error accessing notifications table:', notificationsError.message);
      console.error('Code:', notificationsError.code);
      return;
    }
    
    console.log('✅ Notifications table access successful!');
    
    // Try to access the appUsers table
    console.log('Testing appUsers table access...');
    const { data: appUsersData, error: appUsersError } = await supabase
      .from('appUsers')
      .select('id')
      .limit(1);
      
    if (appUsersError) {
      console.error('❌ Error accessing appUsers table:', appUsersError.message);
      console.error('Code:', appUsersError.code);
      return;
    }
    
    console.log('✅ appUsers table access successful!');
    
    // Try to access the notification_preferences table
    console.log('Testing notification_preferences table access...');
    const { data: preferencesData, error: preferencesError } = await supabase
      .from('notification_preferences')
      .select('id')
      .limit(1);
      
    if (preferencesError) {
      console.error('❌ Error accessing notification_preferences table:', preferencesError.message);
      console.error('Code:', preferencesError.code);
      return;
    }
    
    console.log('✅ notification_preferences table access successful!');
    
  } catch (err) {
    console.error('❌ Exception occurred:', err.message);
  }
}

testServiceRoleAccess();