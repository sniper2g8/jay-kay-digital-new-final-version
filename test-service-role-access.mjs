/**
 * Simple test to check if service role client can access tables
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

async function testServiceRoleAccess() {
  console.log('Testing service role access...\n');
  
  try {
    // Test basic connection
    console.log('1. Testing basic connection...');
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .limit(1);
      
    if (error) {
      console.log(`  ❌ Connection error: ${error.message}`);
      console.log(`  Code: ${error.code}`);
      return;
    }
    
    console.log('  ✅ Connection successful');
    console.log(`  Retrieved ${data.length} records`);
    
    // Test insert
    console.log('\n2. Testing insert capability...');
    const testRecord = {
      recipient_id: 'test-user-123',
      title: 'Service Role Test',
      message: 'Testing service role access',
      type: 'job_update',
      created_at: new Date().toISOString()
    };
    
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('notifications')
      .insert(testRecord)
      .select();
      
    if (insertError) {
      console.log(`  ❌ Insert error: ${insertError.message}`);
      console.log(`  Code: ${insertError.code}`);
      return;
    }
    
    console.log('  ✅ Insert successful');
    const recordId = insertData[0].id;
    console.log(`  Inserted record ID: ${recordId}`);
    
    // Clean up
    console.log('\n3. Cleaning up test record...');
    const { error: deleteError } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', recordId);
      
    if (deleteError) {
      console.log(`  ⚠️  Cleanup error: ${deleteError.message}`);
    } else {
      console.log('  ✅ Cleanup successful');
    }
    
    console.log('\n🎉 Service role access test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testServiceRoleAccess().catch(console.error);