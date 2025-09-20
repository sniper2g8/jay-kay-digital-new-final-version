/**
 * Test using the exact same configuration as supabase-admin.ts
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

// Replicate the exact same configuration as supabase-admin.ts
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

async function testExactConfiguration() {
  console.log('Testing exact service role configuration...\n');
  
  try {
    console.log('Attempting to access notifications table...');
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .limit(1);
      
    if (error) {
      console.log(`  ❌ Error: ${error.message}`);
      console.log(`  Code: ${error.code}`);
      
      // Let's also check what kind of client we have
      console.log('\nClient info:');
      console.log(`  Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
      console.log(`  Service Role Key length: ${process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0}`);
      
      return;
    }
    
    console.log('  ✅ Success!');
    console.log(`  Retrieved ${data.length} records`);
    
  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

testExactConfiguration().catch(console.error);