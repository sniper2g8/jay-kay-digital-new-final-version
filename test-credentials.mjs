/**
 * Simple script to test if credentials are properly configured
 */

import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

console.log('🔐 Testing Credentials Configuration...\\n');

// Check Supabase URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
if (supabaseUrl) {
  console.log('  Value:', supabaseUrl);
  console.log('  Format correct:', supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co') ? '✅ Yes' : '❌ No');
}

console.log('');

// Check Anon Key
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
console.log('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY:', anonKey && anonKey !== 'your-anon-key-here' ? '✅ Set' : '❌ Missing/Placeholder');
if (anonKey) {
  console.log('  Length:', anonKey.length);
  console.log('  Looks like key:', anonKey.startsWith('ey') ? '✅ Yes' : '❓ Maybe');
}

console.log('');

// Check Service Role Key
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
console.log('SUPABASE_SERVICE_ROLE_KEY:', serviceKey && serviceKey !== 'your-service-role-key-here' ? '✅ Set' : '❌ Missing/Placeholder');
if (serviceKey) {
  console.log('  Length:', serviceKey.length);
  console.log('  Looks like key:', serviceKey.startsWith('ey') ? '✅ Yes' : '❓ Maybe');
}

console.log('');

// Check DB Password
const dbPassword = process.env.SUPABASE_DB_PASSWORD;
console.log('SUPABASE_DB_PASSWORD:', dbPassword && dbPassword !== 'your-postgres-password-here' ? '✅ Set' : '❌ Missing/Placeholder');

console.log('\\n📋 Instructions:');
console.log('1. If any values show ❌, update them in .env.local');
console.log('2. Get actual values from your Supabase project dashboard');
console.log('3. Refer to GETTING_SUPABASE_CREDENTIALS.md for detailed instructions');
console.log('4. After updating, run this script again to verify');