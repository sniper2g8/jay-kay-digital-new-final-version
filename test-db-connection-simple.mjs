/**
 * Simple script to test database connection with current credentials
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('🔍 Testing Database Connection with Current Credentials\\n');

// Check if required environment variables are set
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

let missingVars = [];
requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.log('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.log(`   - ${varName}`));
  process.exit(1);
}

// Test 1: Test with anon key (public access)
console.log('1️⃣ Testing with Anon Key (Public Access)');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (supabaseAnonKey.includes('your-') || supabaseAnonKey.length < 20) {
  console.log('   ❌ Anon key appears to be a placeholder');
  console.log('   💡 Please update NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY in .env.local');
} else {
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Test a simple query
    const { data, error } = await supabaseAnon
      .from('appUsers')
      .select('count()', { count: 'exact', head: true });
    
    if (error) {
      console.log(`   ❌ Anon key test failed: ${error.message}`);
    } else {
      console.log(`   ✅ Anon key working - appUsers table accessible (${data.length} records)`);
    }
  } catch (error) {
    console.log(`   ❌ Anon key test failed: ${error.message}`);
  }
}

console.log('');

// Test 2: Test with service role key (admin access)
console.log('2️⃣ Testing with Service Role Key (Admin Access)');
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (supabaseServiceKey.includes('your-') || supabaseServiceKey.length < 20) {
  console.log('   ❌ Service role key appears to be a placeholder');
  console.log('   💡 Please update SUPABASE_SERVICE_ROLE_KEY in .env.local');
} else {
  const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Test a simple query
    const { data, error } = await supabaseService
      .from('appUsers')
      .select('count()', { count: 'exact', head: true });
    
    if (error) {
      console.log(`   ❌ Service role key test failed: ${error.message}`);
    } else {
      console.log(`   ✅ Service role key working - appUsers table accessible (${data.length} records)`);
    }
  } catch (error) {
    console.log(`   ❌ Service role key test failed: ${error.message}`);
  }
}

console.log('');

// Test 3: Test statement periods access (the original issue)
console.log('3️⃣ Testing Statement Periods Access (Original Issue)');
if (supabaseServiceKey && !supabaseServiceKey.includes('your-') && supabaseServiceKey.length > 20) {
  const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const { data, error } = await supabaseService
      .from('customer_statement_periods')
      .select('count()', { count: 'exact', head: true });
    
    if (error) {
      console.log(`   ❌ Statement periods access failed: ${error.message}`);
      if (error.message.includes('permission denied')) {
        console.log('   💡 This indicates a database permission issue that needs to be fixed with SQL policies');
      }
    } else {
      console.log(`   ✅ Statement periods accessible (${data.length} records)`);
      console.log('   🎉 The original "Error fetching statement periods: {}" should now be resolved!');
    }
  } catch (error) {
    console.log(`   ❌ Statement periods test failed: ${error.message}`);
  }
} else {
  console.log('   ⚠️  Cannot test statement periods - service role key is not properly configured');
}

console.log('\\n📋 Summary:');
console.log('============');
console.log('To fix the "Error fetching statement periods: {}" issue, you need:');
console.log('1. ✅ Proper credentials in .env.local (currently missing)');
console.log('2. ✅ Correct SQL policies applied to database tables (if credentials work)');

console.log('\\n💡 Next Steps:');
console.log('1. Update your credentials in .env.local using GET-CREDENTIALS-GUIDE.md');
console.log('2. Run this script again to verify');
console.log('3. If credentials work but you still see permission errors, apply the SQL fixes');