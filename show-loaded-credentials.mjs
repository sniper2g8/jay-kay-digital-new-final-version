/**
 * Script to show exactly what credentials are being loaded
 */

import dotenv from 'dotenv';
import fs from 'fs';

console.log('🔍 Showing Loaded Credentials\\n');

// First, let's see what's actually in the .env.local file
console.log('📄 Contents of .env.local (relevant lines):');
console.log('==========================================');

const envContent = fs.readFileSync('.env.local', 'utf8');
const lines = envContent.split('\n');

const relevantKeys = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_DB_PASSWORD'
];

lines.forEach(line => {
  relevantKeys.forEach(key => {
    if (line.includes(key) && !line.trim().startsWith('#')) {
      console.log(line.trim());
    }
  });
});

console.log('\\n🔧 Loading environment variables...');
console.log('================================');

// Load environment variables
const result = dotenv.config({ path: '.env.local' });

if (result.error) {
  console.log('❌ Error loading .env.local:', result.error.message);
  process.exit(1);
}

console.log('✅ Environment variables loaded successfully\\n');

console.log('🔑 Loaded Values:');
console.log('================');

relevantKeys.forEach(key => {
  const value = process.env[key];
  if (value) {
    // Show first and last few characters for security
    const displayValue = value.length > 20 
      ? `${value.substring(0, 10)}...${value.substring(value.length - 10)}`
      : value;
    console.log(`${key}: ${displayValue} (length: ${value.length})`);
  } else {
    console.log(`${key}: ❌ NOT SET`);
  }
});

console.log('\\n🧪 Testing Supabase Connection...');
console.log('==============================');

// Test the connection
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(`Supabase URL: ${supabaseUrl}`);

// Test 1: Basic connection with anon key
console.log('\\n1️⃣ Testing with Anon Key:');
if (supabaseUrl && supabaseKey) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('   ✅ Supabase client created');
    
    // Try a simple health check
    const { data, error } = await supabase.rpc('generate_number');
    if (error) {
      console.log(`   ❌ Health check failed: ${error.message}`);
    } else {
      console.log('   ✅ Health check passed');
    }
  } catch (error) {
    console.log(`   ❌ Client creation failed: ${error.message}`);
  }
} else {
  console.log('   ❌ Missing URL or key');
}

// Test 2: Connection with service role key
console.log('\\n2️⃣ Testing with Service Role Key:');
if (supabaseUrl && serviceRoleKey) {
  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    console.log('   ✅ Supabase client created (service role)');
    
    // Try accessing appUsers table
    const { data, error } = await supabase
      .from('appUsers')
      .select('count()', { count: 'exact', head: true });
    
    if (error) {
      console.log(`   ❌ appUsers access failed: ${error.message}`);
    } else {
      console.log(`   ✅ appUsers accessible (${data.length} records)`);
    }
  } catch (error) {
    console.log(`   ❌ Service role client creation failed: ${error.message}`);
  }
} else {
  console.log('   ❌ Missing URL or service role key');
}

console.log('\\n📋 Summary:');
console.log('===========');
console.log('If the credentials are loading correctly but you still see connection errors,');
console.log('the issue might be with the actual values or database permissions.');