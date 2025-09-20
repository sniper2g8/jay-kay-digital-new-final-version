/**
 * Debug script for notification service
 * Tests basic environment and connectivity
 */

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('Testing environment variables...');

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

let allEnvVarsPresent = true;

for (const envVar of requiredEnvVars) {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}: Set`);
  } else {
    console.error(`❌ ${envVar}: Missing`);
    allEnvVarsPresent = false;
  }
}

if (!allEnvVarsPresent) {
  console.log('\n❌ Missing required environment variables');
  process.exit(1);
}

console.log('\n✅ All required environment variables are present');

// Test basic Supabase connection
console.log('\nTesting Supabase connection...');

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

// Test regular client
try {
  const regularClient = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Regular Supabase client created');
} catch (error) {
  console.error('❌ Error creating regular Supabase client:', error.message);
}

// Test service role client
try {
  const serviceClient = createClient(supabaseUrl, serviceRoleKey);
  console.log('✅ Service role Supabase client created');
} catch (error) {
  console.error('❌ Error creating service role Supabase client:', error.message);
}

console.log('\n✅ Debug script completed');