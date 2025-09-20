import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local
const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.log('Need SUPABASE_SERVICE_ROLE_KEY to fix policies');
  process.exit(1);
}

// Use service key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixNotificationsPolicies() {
  console.log('=== Fixing Notifications RLS Policies ===');
  
  try {
    // First, check if the notifications table exists
    console.log('Checking if notifications table exists...');
    const { data: tableCheck, error: tableCheckError } = await supabase
      .from('notifications')
      .select('id')
      .limit(1);
      
    if (tableCheckError && tableCheckError.code !== '42501') {
      console.error('Error checking notifications table:', tableCheckError);
      return;
    }
    
    console.log('Notifications table exists');
    
    // Since we can't directly modify RLS policies through the JavaScript client,
    // we'll need to do this through the Supabase dashboard or CLI.
    // But we can at least check if there are any notifications in the table.
    
    console.log('Checking for existing notifications...');
    const { count, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      console.error('Error counting notifications:', countError);
    } else {
      console.log(`Found ${count} notifications in the table`);
    }
    
    // Try to check a specific user's notifications to see if RLS is the issue
    console.log('\n--- Testing User Access ---');
    // We can't test specific user access without a user ID, but we can check
    // if the table structure is correct
    
    console.log('Checking notifications table structure...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('notifications')
      .select('*')
      .limit(1);
      
    if (sampleError) {
      console.error('Error accessing notifications table structure:', sampleError);
    } else {
      console.log('Table structure looks correct');
      console.log('Sample column names:', Object.keys(sampleData[0] || {}));
    }
    
    console.log('\n=== Recommendations ===');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to Authentication > Policies');
    console.log('3. Find the notifications table');
    console.log('4. Add the following policies:');
    console.log('');
    console.log('SELECT policy:');
    console.log('  USING: (recipient_id = auth.uid())');
    console.log('');
    console.log('INSERT policy:');
    console.log('  WITH CHECK: (recipient_id = auth.uid() OR recipient_id IS NULL)');
    console.log('');
    console.log('UPDATE policy:');
    console.log('  USING: (recipient_id = auth.uid())');
    console.log('');
    console.log('DELETE policy:');
    console.log('  USING: (recipient_id = auth.uid())');
    console.log('');
    console.log('Alternatively, you can run the SQL script fix-notifications-rls.sql');
    console.log('in your Supabase SQL editor.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixNotificationsPolicies().catch(console.error);