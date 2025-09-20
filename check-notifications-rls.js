import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

async function checkNotificationsRLS() {
  console.log('🔍 Checking notifications RLS configuration...');
  
  // Use service role key for admin access
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    // Test if we can access the notifications table with admin privileges
    console.log('\n1. Testing admin access to notifications table...');
    const { data, error } = await supabase
      .from('notifications')
      .select('count')
      .limit(1);
      
    if (error) {
      console.error('❌ Admin access failed:', error);
      console.log('\nThis indicates RLS is enabled but policies may be missing.');
      
      // Try to get more details about the table
      console.log('\n2. Checking table structure...');
      const { data: schemaData, error: schemaError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'notifications')
        .eq('table_schema', 'public')
        .order('ordinal_position');
        
      if (schemaError) {
        console.error('❌ Error getting table schema:', schemaError);
      } else {
        console.log('📋 Notifications table columns:');
        schemaData.forEach((column, index) => {
          console.log(`  ${index + 1}. ${column.column_name}: ${column.data_type} ${column.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
        });
      }
    } else {
      console.log('✅ Admin access successful');
      console.log('📋 Table exists and is accessible with service role key');
    }
    
    console.log('\n📋 To fix RLS policies, run the SQL commands in fix-notifications-rls-policies.sql');
    console.log('   or check the instructions in FIX_NOTIFICATIONS_RLS.md');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkNotificationsRLS().catch(console.error);