/**
 * Detailed diagnostic script to identify credential issues
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('🔍 Detailed Credential Diagnosis\\n');

// Check if .env.local exists
const envLocalPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envLocalPath)) {
  console.log('❌ .env.local file not found!');
  console.log('   Please make sure you are in the project root directory');
  process.exit(1);
}

console.log('📄 .env.local File Analysis');
console.log('==========================');

// Read the file content
const envContent = fs.readFileSync(envLocalPath, 'utf8');

// Check for specific placeholder patterns
const issues = [];

// Check Supabase URL
const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.+)/);
if (urlMatch) {
  const url = urlMatch[1].trim();
  console.log(`✅ Supabase URL: ${url}`);
  if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
    issues.push('Supabase URL format appears incorrect');
  }
} else {
  console.log('❌ Supabase URL: Not found');
  issues.push('Supabase URL not found');
}

// Check Anon Key
const anonKeyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY\s*=\s*(.+)/);
if (anonKeyMatch) {
  const anonKey = anonKeyMatch[1].trim();
  if (anonKey.includes('your-') || anonKey === 'your-anon-key-here' || anonKey.length < 20) {
    console.log('❌ Anon Key: Placeholder value detected');
    issues.push('Anon Key is still a placeholder');
  } else {
    console.log('✅ Anon Key: Appears to be set (length: ' + anonKey.length + ')');
  }
} else {
  console.log('❌ Anon Key: Not found');
  issues.push('Anon Key not found');
}

// Check Service Role Key
const serviceKeyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.+)/);
if (serviceKeyMatch) {
  const serviceKey = serviceKeyMatch[1].trim();
  if (serviceKey.includes('your-') || serviceKey === 'your-service-role-key-here' || serviceKey.length < 20) {
    console.log('❌ Service Role Key: Placeholder value detected');
    issues.push('Service Role Key is still a placeholder');
  } else {
    console.log('✅ Service Role Key: Appears to be set (length: ' + serviceKey.length + ')');
  }
} else {
  console.log('❌ Service Role Key: Not found');
  issues.push('Service Role Key not found');
}

// Check Database Password
const dbPasswordMatch = envContent.match(/SUPABASE_DB_PASSWORD\s*=\s*(.+)/);
if (dbPasswordMatch) {
  const dbPassword = dbPasswordMatch[1].trim();
  if (dbPassword.includes('your-') || dbPassword === 'your-postgres-password-here' || dbPassword.length < 5) {
    console.log('❌ Database Password: Placeholder value detected');
    issues.push('Database Password is still a placeholder');
  } else {
    console.log('✅ Database Password: Appears to be set (length: ' + dbPassword.length + ')');
  }
} else {
  console.log('❌ Database Password: Not found');
  issues.push('Database Password not found');
}

console.log('\\n🔍 Environment Variables (from process.env)');
console.log('=========================================');

// Check if environment variables are loaded
const envVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_DB_PASSWORD'
];

envVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: Not set`);
  } else if (value.includes('your-') || value.length < 10) {
    console.log(`❌ ${varName}: Placeholder value detected`);
  } else {
    console.log(`✅ ${varName}: Set (length: ${value.length})`);
  }
});

console.log('\\n📋 Issues Found:');
console.log('===============');
if (issues.length === 0) {
  console.log('✅ No issues found! Your credentials appear to be properly configured.');
  console.log('\\n💡 You should now be able to connect to your Supabase database.');
} else {
  console.log(`❌ ${issues.length} issue(s) found:`);
  issues.forEach((issue, index) => {
    console.log(`   ${index + 1}. ${issue}`);
  });
  
  console.log('\\n🔧 How to Fix:');
  console.log('=============');
  console.log('1. Open your .env.local file');
  console.log('2. Replace placeholder values with actual credentials:');
  console.log('   - Get your keys from Supabase Dashboard > Project Settings > API');
  console.log('   - Get your database password from Supabase Dashboard > Project Settings > Database');
  console.log('3. Save the file');
  console.log('4. Run this script again to verify');
  
  console.log('\\n📖 For detailed instructions, see GET-CREDENTIALS-GUIDE.md');
}

console.log('\\n💡 Pro Tip: After updating credentials, restart your development server to ensure changes take effect.');