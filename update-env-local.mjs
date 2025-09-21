/**
 * Script to help update .env.local with actual credentials
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envLocalPath = path.join(__dirname, '.env.local');

console.log('🔧 Update .env.local Script\\n');

// Check if .env.local exists
if (!fs.existsSync(envLocalPath)) {
  console.log('❌ .env.local file not found');
  console.log('Please make sure you are in the project root directory');
  process.exit(1);
}

// Read the current .env.local file
let envContent = fs.readFileSync(envLocalPath, 'utf8');

console.log('📝 Current .env.local file status:');
console.log('=====================================');

// Check for placeholder values
const checks = [
  { key: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY', placeholder: 'your-anon-key-here' },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', placeholder: 'your-service-role-key-here' },
  { key: 'SUPABASE_DB_PASSWORD', placeholder: 'your-postgres-password-here' },
  { key: 'RESEND_API_KEY', placeholder: 'your-resend-api-key-here' },
  { key: 'TWILIO_ACCOUNT_SID', placeholder: 'your_twilio_account_sid' },
  { key: 'TWILIO_AUTH_TOKEN', placeholder: 'your_twilio_auth_token' },
  { key: 'TWILIO_PHONE_NUMBER', placeholder: 'your_twilio_phone_number' }
];

let hasPlaceholders = false;

checks.forEach(check => {
  const regex = new RegExp(`${check.key}\\s*=\\s*${check.placeholder}`);
  if (regex.test(envContent)) {
    console.log(`❌ ${check.key}: Still using placeholder value`);
    hasPlaceholders = true;
  } else {
    const valueMatch = envContent.match(new RegExp(`${check.key}\\s*=\\s*(.+)$`, 'm'));
    if (valueMatch) {
      console.log(`✅ ${check.key}: Set (value hidden for security)`);
    } else {
      console.log(`⚠️  ${check.key}: Not found`);
    }
  }
});

if (!hasPlaceholders) {
  console.log('\\n🎉 All credentials appear to be properly configured!');
  console.log('You should now be able to connect to your Supabase database.');
  process.exit(0);
}

console.log('\\n📋 Instructions to fix placeholder values:');
console.log('========================================');

console.log('1. Get your Supabase credentials:');
console.log('   - Go to https://app.supabase.com/');
console.log('   - Select your project (pnoxqzlxfuvjvufdjuqh)');
console.log('   - Go to Project Settings > API');
console.log('   - Copy your anon key for NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY');
console.log('   - Copy your service_role key for SUPABASE_SERVICE_ROLE_KEY');
console.log('');
console.log('2. Get your database password:');
console.log('   - In the same project, go to Project Settings > Database');
console.log('   - Find your Password under Connection Info');
console.log('');
console.log('3. Update your .env.local file with the actual values');
console.log('');
console.log('4. Run this script again to verify');

console.log('\\n🔐 Security Note:');
console.log('==================');
console.log('- Never commit your actual credentials to version control');
console.log('- The .gitignore file should already exclude .env* files');
console.log('- Keep your credentials secure and rotate them periodically');