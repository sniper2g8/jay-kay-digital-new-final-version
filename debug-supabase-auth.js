const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function debugSupabaseAuth() {
  console.log('🔍 Debugging Supabase authentication and permissions...');
  
  // Test with different configurations
  const configs = [
    {
      name: 'Service Role Key',
      client: createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    },
    {
      name: 'Anon Key',
      client: createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    }
  ];
  
  for (const config of configs) {
    console.log(`\n=== Testing ${config.name} ===`);
    
    try {
      // Test basic connection
      const { data, error } = await config.client
        .from('customers')
        .select('count')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${config.name} error:`, {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
      } else {
        console.log(`✅ ${config.name} works! Data:`, data);
      }
      
      // Test auth status
      const { data: sessionData, error: authError } = await config.client.auth.getSession();
      console.log(`${config.name} session:`, sessionData.session ? 'Authenticated' : 'Anonymous');
      
    } catch (error) {
      console.log(`❌ ${config.name} exception:`, error.message);
    }
  }
  
  // Test with manual auth bypass using the service role
  console.log('\n=== Testing Service Role with Auth Bypass ===');
  try {
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // The service role should bypass RLS entirely
    const { data, error } = await serviceClient
      .from('customers')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Service role with bypass error:', error);
    } else {
      console.log('✅ Service role with bypass works!', data?.length, 'records');
    }
    
  } catch (error) {
    console.log('❌ Service role bypass exception:', error.message);
  }
  
  // Test the specific query patterns from the app
  console.log('\n=== Testing App-specific Queries ===');
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Test notification count query (from useNotifications)
  try {
    const { count, error } = await serviceClient
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', 'test-user-id')
      .is('read_at', null);
    
    if (error) {
      console.log('❌ Notification count error:', error);
    } else {
      console.log('✅ Notification count works:', count);
    }
  } catch (error) {
    console.log('❌ Notification count exception:', error.message);
  }
}

debugSupabaseAuth();