/**
 * Simple script to check environment variables and test service role key
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('Checking environment variables...\n');

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

for (const varName of requiredVars) {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: ${process.env[varName].substring(0, 30)}...`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
}

// Check service role key format
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log(`\nService Role Key Analysis:`);
  console.log(`  Length: ${key.length}`);
  console.log(`  Starts with: ${key.substring(0, 10)}`);
  console.log(`  Ends with: ${key.substring(key.length - 10)}`);
  
  // Check if it looks like a valid Supabase service role key
  if (key.startsWith('sb_') && key.includes('_secret_')) {
    console.log(`  ✅ Key format looks correct`);
  } else {
    console.log(`  ⚠️  Key format might be incorrect`);
  }
}

console.log('\nAll environment variables checked.');