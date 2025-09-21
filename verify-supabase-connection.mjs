/**
 * Script to verify Supabase connection with updated credentials
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

console.log('🔍 Verifying Supabase Connection\\n');

// Load environment variables
dotenv.config({ path: '.env.local' });

// Check if required environment variables are set
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_DB_PASSWORD'
];

console.log('📋 Checking Environment Variables:');
console.log('===============================');  

let allSet = true;
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: NOT SET`);
    allSet = false;
  } else if (value.startsWith('//')) {
    console.log(`❌ ${varName}: Still a placeholder comment`);
    allSet = false;
  } else {
    console.log(`✅ ${varName}: Set (length: ${value.length})`);
  }
});

if (!allSet) {
  console.log('\\n⚠️  Some environment variables are not properly configured.');
  console.log('Please update your .env.local file with actual Supabase credentials.');
  console.log('Run: node get-actual-supabase-keys.mjs for instructions.');
  process.exit(1);
}

console.log('\\n🧪 Testing Supabase Connection...');
console.log('==============================');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Test 1: Basic connection with anon key
console.log('\\n1️⃣ Testing with Anon Key:');
try {
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  console.log('   ✅ Supabase client created with anon key');
  
  // Test a simple operation
  console.log('   🔍 Testing basic query...');
  const { data, error } = await supabaseAnon
    .from('appUsers')
    .select('id')
    .limit(1);
  
  if (error) {
    console.log(`   ❌ Query failed: ${error.message}`);
    if (error.message.includes('Invalid API key')) {
      console.log('   💡 This indicates your anon key is invalid. Please check it.');
    }
  } else {
    console.log('   ✅ Basic query successful');
  }
} catch (error) {
  console.log(`   ❌ Client creation failed: ${error.message}`);
}

// Test 2: Connection with service role key
console.log('\\n2️⃣ Testing with Service Role Key:');
try {
  const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
  console.log('   ✅ Supabase client created with service role key');
  
  // Test accessing statement periods (the original issue)
  console.log('   🔍 Testing statement periods access...');
  const { data, error } = await supabaseService
    .from('customer_statement_periods')
    .select('count()', { count: 'exact', head: true });
  
  if (error) {
    console.log(`   ❌ Statement periods access failed: ${error.message}`);
    if (error.message.includes('permission denied')) {
      console.log('   💡 This indicates a database permission issue.');
      console.log('   💡 You may need to apply the SQL fixes from complete-permission-fix.sql');
    } else if (error.message.includes('Invalid API key')) {
      console.log('   💡 This indicates your service role key is invalid. Please check it.');
    }
  } else {
    console.log(`   ✅ Statement periods accessible (${data.length} records)`);
    console.log('   🎉 The original "Error fetching statement periods: {}" should now be resolved!');
  }
} catch (error) {
  console.log(`   ❌ Service role client creation failed: ${error.message}`);
}

// Test 3: Check if keys look valid
console.log('\\n3️⃣ Validating Key Format:');
console.log('======================');

const validateKey = (key, name) => {
  if (!key) {
    console.log(`❌ ${name}: Not set`);
    return false;
  }
  
  if (key.startsWith('//')) {
    console.log(`❌ ${name}: Still a placeholder`);
    return false;
  }
  
  if (key.startsWith('eyJ') && key.length > 100) {
    console.log(`✅ ${name}: Format looks correct`);
    return true;
  } else if (name.includes('Password') && key.length > 8) {
    console.log(`✅ ${name}: Format looks correct`);
    return true;
  } else {
    console.log(`⚠️  ${name}: Format might be incorrect`);
    console.log(`   Expected: JWT token starting with 'eyJ' for API keys, or complex password for DB`);
    console.log(`   Actual: ${key.substring(0, 30)}${key.length > 30 ? '...' : ''}`);
    return false;
  }
};

validateKey(supabaseAnonKey, 'Anon Key');
validateKey(supabaseServiceKey, 'Service Role Key');
validateKey(process.env.SUPABASE_DB_PASSWORD, 'Database Password');

console.log('\\n📋 Summary:');
console.log('===========');
console.log('If all validations pass and you can access the tables,');
console.log('your Supabase connection should be working correctly.');
console.log('\\nIf you still see errors, check:');
console.log('1. That your keys are the actual values from Supabase dashboard');
console.log('2. That your database permissions are correctly set');
console.log('3. That your network connection is working');