import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local specifically
const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
  console.log('✅ Loaded environment variables from .env.local');
} else {
  console.log('❌ .env.local file not found');
}

console.log('🔍 Testing New Supabase API Keys Format\n');

// Check environment variables
console.log('📋 Environment Variables Check:');
console.log('============================');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;

console.log(`${supabaseUrl ? '✅' : '❌'} NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? `SET (length: ${supabaseUrl.length})` : 'NOT SET'}`);
console.log(`${supabaseAnonKey ? '✅' : '❌'} NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: ${supabaseAnonKey ? `SET (length: ${supabaseAnonKey.length})` : 'NOT SET'}`);
console.log(`${supabaseSecretKey ? '✅' : '❌'} SUPABASE_SECRET_KEY: ${supabaseSecretKey ? `SET (length: ${supabaseSecretKey.length})` : 'NOT SET'}`);
console.log(`${dbPassword ? '✅' : '❌'} SUPABASE_DB_PASSWORD: ${dbPassword ? 'SET' : 'NOT SET'}`);

console.log('\n🧪 Testing Supabase Connection...');
console.log('==============================\n');

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Missing required environment variables. Please check your .env.local file.');
  process.exit(1);
}

try {
  // 1. Test with publishable key (client-side)
  console.log('1️⃣ Testing with Publishable Key:');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('   ✅ Supabase client created with publishable key');
  
  // Test basic access
  console.log('   🔍 Testing basic access...');
  const { data, error } = await supabase.from('appUsers').select('id').limit(1);
  if (error) {
    console.log('   ❌ Error with basic access:', error.message);
  } else {
    console.log('   ✅ Basic access works');
  }

  // 2. Test with secret key (server-side/service role)
  console.log('\n2️⃣ Testing with Secret Key:');
  if (supabaseSecretKey) {
    const supabaseService = createClient(supabaseUrl, supabaseSecretKey);
    console.log('   ✅ Supabase client created with secret key');
    
    // Test service role access
    console.log('   🔍 Testing service role access...');
    const { data: serviceData, error: serviceError } = await supabaseService.from('appUsers').select('id').limit(1);
    if (serviceError) {
      console.log('   ❌ Error with service role access:', serviceError.message);
    } else {
      console.log('   ✅ Service role access works');
    }
  } else {
    console.log('   ⚠️  Secret key not properly configured');
  }

  // 3. Validate key formats
  console.log('\n3️⃣ Validating Key Formats:');
  console.log('======================');
  if (supabaseAnonKey && supabaseAnonKey.startsWith('sb_publishable_')) {
    console.log('✅ Publishable Key: Correct format (sb_publishable_...)');
  } else if (supabaseAnonKey) {
    console.log('❌ Publishable Key: Incorrect format');
  } else {
    console.log('❌ Publishable Key: Not set');
  }

  if (supabaseSecretKey && supabaseSecretKey.startsWith('sb_secret_')) {
    console.log('✅ Secret Key: Correct format (sb_secret_...)');
  } else if (supabaseSecretKey) {
    console.log('❌ Secret Key: Incorrect format');
  } else {
    console.log('❌ Secret Key: Not set');
  }

  if (dbPassword) {
    console.log('✅ Database Password: Set');
  } else {
    console.log('❌ Database Password: Not set');
  }

  // 4. Test specific access to statement periods table
  console.log('\n4️⃣ Testing Access to Statement Periods:');
  console.log('=============================');
  const { data: statementData, error: statementError } = await supabase.from('customer_statement_periods').select('id').limit(1);
  if (statementError) {
    console.log('   ❌ Error accessing statement periods:', statementError.message);
    
    // Try with service role client
    console.log('   🔍 Trying with service role client...');
    if (supabaseSecretKey) {
      const supabaseService = createClient(supabaseUrl, supabaseSecretKey);
      const { data: serviceStatementData, error: serviceStatementError } = await supabaseService.from('customer_statement_periods').select('id').limit(1);
      if (serviceStatementError) {
        console.log('   ❌ Error accessing statement periods with service role:', serviceStatementError.message);
      } else {
        console.log('   ✅ Access to statement periods works with service role');
      }
    }
  } else {
    console.log('   ✅ Access to statement periods works');
  }

} catch (error) {
  console.error('❌ Unexpected error during testing:', error.message);
}

console.log('\n📋 Summary:');
console.log('===========');
console.log('If all validations pass and you can access the tables,');
console.log('your Supabase connection with new API keys should be working correctly.\n');
console.log('If you still see errors, check:');
console.log('1. That your keys are the actual values from Supabase dashboard');
console.log('2. That your database permissions are correctly set');
console.log('3. That your network connection is working');