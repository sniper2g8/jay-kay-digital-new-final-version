/**
 * Test using Supabase admin API with different approaches
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

console.log('Testing different Supabase client configurations...\n');

// Test 1: Basic configuration
console.log('Test 1: Basic configuration');
try {
  const supabase1 = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  console.log('  Client created successfully');
} catch (error) {
  console.log(`  ❌ Error: ${error.message}`);
}

// Test 2: With auth options (like in supabase-admin.ts)
console.log('\nTest 2: With auth options');
try {
  const supabase2 = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  console.log('  Client created successfully');
} catch (error) {
  console.log(`  ❌ Error: ${error.message}`);
}

// Test 3: With additional options
console.log('\nTest 3: With additional options');
try {
  const supabase3 = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    }
  );
  
  console.log('  Client created successfully');
  
  // Try to access the table
  console.log('\n  Attempting to access notifications table...');
  supabase3.from('notifications').select('*').limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.log(`    ❌ Error: ${error.message}`);
      } else {
        console.log('    ✅ Success!');
      }
    })
    .catch(error => {
      console.log(`    ❌ Exception: ${error.message}`);
    });
    
} catch (error) {
  console.log(`  ❌ Error: ${error.message}`);
}

console.log('\nAll tests completed.');