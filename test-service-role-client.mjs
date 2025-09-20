import dotenv from 'dotenv';
import { createServiceRoleClient } from './src/lib/supabase-admin.ts';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testServiceRoleClient() {
  console.log('Testing Service Role Client...');
  
  try {
    const adminSupabase = createServiceRoleClient();
    
    // Test notifications table access
    console.log('Testing notifications table access...');
    const { data, error } = await adminSupabase
      .from('notifications')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Notifications access failed:', error);
    } else {
      console.log('✅ Notifications access successful:', data);
    }
    
    // Test appUsers table access
    console.log('Testing appUsers table access...');
    const { data: users, error: usersError } = await adminSupabase
      .from('appUsers')
      .select('id, email, phone')
      .eq('primary_role', 'admin')
      .limit(1);
    
    if (usersError) {
      console.error('❌ appUsers access failed:', usersError);
    } else {
      console.log('✅ appUsers access successful:', users);
    }
    
  } catch (error) {
    console.error('❌ Error with service role client:', error);
  }
}

testServiceRoleClient().catch(console.error);