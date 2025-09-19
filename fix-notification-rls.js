require('dotenv').config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing service role credentials');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function fixNotificationRLS() {
  try {
    console.log('🔧 Fixing notification RLS policies...');

    // Method 1: Try to disable RLS completely for development
    console.log('\n=== Attempting to disable RLS on notifications ===');
    
    const { data: disableResult, error: disableError } = await supabaseAdmin
      .rpc('exec_sql', {
        query: 'ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;'
      });

    if (disableError) {
      console.error('RLS disable failed:', disableError);
      
      // Method 2: Try creating permissive policies
      console.log('\n=== Creating permissive RLS policies ===');
      
      // Create policy to allow all operations for authenticated users
      const policyQueries = [
        `
        CREATE POLICY "Allow authenticated users full access" ON notifications
        FOR ALL USING (auth.role() = 'authenticated');
        `,
        `
        CREATE POLICY "Allow service role full access" ON notifications
        FOR ALL USING (auth.role() = 'service_role');
        `,
        `
        CREATE POLICY "Allow anonymous read access" ON notifications
        FOR SELECT USING (true);
        `
      ];

      for (const query of policyQueries) {
        try {
          const { error: policyError } = await supabaseAdmin.rpc('exec_sql', { query });
          if (policyError) {
            console.error('Policy creation error:', policyError);
          } else {
            console.log('✅ Policy created successfully');
          }
        } catch (err) {
          console.error('Policy creation failed:', err);
        }
      }
    } else {
      console.log('✅ RLS disabled on notifications table');
    }

    // Test access after changes
    console.log('\n=== Testing notification access after fixes ===');
    
    const { data: testData, error: testError } = await supabaseAdmin
      .from('notifications')
      .select('count', { count: 'exact', head: true });

    if (testError) {
      console.error('❌ Admin access still failed:', testError);
    } else {
      console.log('✅ Admin access works');
    }

    // Test with regular client
    const supabaseRegular = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY);
    
    const { data: regularData, error: regularError } = await supabaseRegular
      .from('notifications')
      .select('count', { count: 'exact', head: true });

    if (regularError) {
      console.error('❌ Regular client still failed:', regularError);
    } else {
      console.log('✅ Regular client access works');
    }

  } catch (error) {
    console.error('RLS fix failed:', error);
  }
}

fixNotificationRLS().catch(console.error);