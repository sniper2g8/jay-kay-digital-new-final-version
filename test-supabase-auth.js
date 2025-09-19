require('dotenv').config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

console.log('Environment check:');
console.log('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('SUPABASE_KEY:', supabaseKey ? 'Set (first 20 chars)' + supabaseKey.substring(0, 20) + '...' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseAuth() {
  try {
    console.log('\n=== Testing Supabase Client ===');
    
    // Test 1: Basic connection
    console.log('\n1. Testing basic connection...');
    const { data: basicData, error: basicError } = await supabase
      .from('jobs')
      .select('count')
      .limit(1);
    
    if (basicError) {
      console.error('Basic connection failed:', {
        message: basicError.message,
        code: basicError.code,
        details: basicError.details,
        hint: basicError.hint
      });
    } else {
      console.log('✅ Basic connection successful');
    }

    // Test 2: Check RLS policies
    console.log('\n2. Testing RLS policies...');
    const { data: rlsData, error: rlsError } = await supabase
      .from('jobs')
      .select('*')
      .limit(1);
    
    if (rlsError) {
      console.error('RLS policy test failed:', {
        message: rlsError.message,
        code: rlsError.code,
        details: rlsError.details,
        hint: rlsError.hint
      });
      
      if (rlsError.message.includes('permission denied') || rlsError.message.includes('RLS')) {
        console.log('💡 This suggests RLS policies are blocking access');
        console.log('💡 Try signing in a user or using service role key');
      }
    } else {
      console.log('✅ RLS policies allow access');
      console.log('Data sample:', rlsData?.[0] ? 'Got data' : 'No data returned');
    }

    // Test 3: Try inserting a test notification
    console.log('\n3. Testing notification insertion...');
    const testNotification = {
      id: crypto.randomUUID(),
      recipient_id: 'test-user-id',
      title: 'Test Notification',
      message: 'This is a test',
      type: 'info',
      created_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await supabase
      .from('notifications')
      .insert([testNotification])
      .select()
      .single();

    if (insertError) {
      console.error('Notification insertion failed:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      });
    } else {
      console.log('✅ Notification insertion successful');
      console.log('Inserted notification ID:', insertData?.id);
      
      // Clean up test notification
      await supabase
        .from('notifications')
        .delete()
        .eq('id', insertData.id);
      console.log('🧹 Cleaned up test notification');
    }

  } catch (error) {
    console.error('Test failed with exception:', error);
  }
}

testSupabaseAuth().catch(console.error);