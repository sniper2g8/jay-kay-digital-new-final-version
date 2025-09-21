/**
 * Script to test the anon key you provided
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

console.log('🔍 Testing Your Anon Key\\n');

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

console.log('📋 Key Information:');
console.log('==================');
console.log(`Supabase URL: ${supabaseUrl}`);
console.log(`Anon Key Length: ${supabaseAnonKey?.length || 0}`);
console.log(`Anon Key Starts With: ${supabaseAnonKey?.substring(0, 20) || 'NOT SET'}...`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Missing required environment variables');
  process.exit(1);
}

console.log('\\n🧪 Testing Connection...');
console.log('====================');

try {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Supabase client created successfully');
  
  // Test a simple query to see if the key works
  console.log('\\n🔍 Testing basic access...');
  
  // Try to access appUsers table (this might fail due to RLS)
  const { data: appUsersData, error: appUsersError } = await supabase
    .from('appUsers')
    .select('id')
    .limit(1);
  
  if (appUsersError) {
    console.log(`⚠️  appUsers access failed: ${appUsersError.message}`);
    console.log('   This might be expected due to RLS policies');
  } else {
    console.log(`✅ appUsers accessible (${appUsersData.length} records)`);
  }
  
  // Try to access a public table or function if available
  console.log('\\n🔍 Testing public access...');
  const { data: publicData, error: publicError } = await supabase
    .from('appUsers')
    .select('count()', { count: 'exact', head: true });
  
  if (publicError) {
    console.log(`⚠️  Public access test failed: ${publicError.message}`);
  } else {
    console.log(`✅ Public access working (${publicData.length} records)`);
  }
  
} catch (error) {
  console.log(`❌ Connection failed: ${error.message}`);
}

console.log('\\n📋 Next Steps:');
console.log('=============');
console.log('1. Please provide your SUPABASE_SERVICE_ROLE_KEY');
console.log('2. Please provide your SUPABASE_DB_PASSWORD');
console.log('3. Update your .env.local file with these values');
console.log('4. Run the full verification script: node verify-supabase-connection.mjs');