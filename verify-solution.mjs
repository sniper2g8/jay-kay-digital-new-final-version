/**
 * Script to verify that the database solution is working correctly
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🧪 Verifying Database Solution...\\n');

// Test 1: Service role access
console.log('1️⃣ Testing Service Role Access');
if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Missing Supabase configuration\\n');
} else {
  const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
  
  const tables = [
    'appUsers',
    'customers', 
    'jobs',
    'invoices',
    'payments',
    'customer_statement_periods',
    'customer_statement_transactions',
    'customer_account_balances',
    'statement_settings'
  ];
  
  let serviceRoleSuccess = true;
  
  for (const table of tables) {
    try {
      const { data, error } = await supabaseService
        .from(table)
        .select('count()', { count: 'exact', head: true });
      
      if (error) {
        console.log(`  ❌ ${table}: ${error.message}`);
        serviceRoleSuccess = false;
      } else {
        console.log(`  ✅ ${table}: Accessible (${data.length} rows)`);
      }
    } catch (error) {
      console.log(`  ❌ ${table}: ${error.message}`);
      serviceRoleSuccess = false;
    }
  }
  
  console.log(`\\nService Role Access: ${serviceRoleSuccess ? '✅ SUCCESS' : '❌ FAILED'}\\n`);
}

// Test 2: Regular user access (if we have a user session)
console.log('2️⃣ Testing Regular User Access');
if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Missing Supabase configuration\\n');
} else {
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  
  const tables = [
    'appUsers',
    'customers', 
    'jobs',
    'invoices',
    'payments',
    'customer_statement_periods',
    'customer_statement_transactions',
    'customer_account_balances',
    'statement_settings'
  ];
  
  let anonUserSuccess = true;
  
  for (const table of tables) {
    try {
      const { data, error } = await supabaseAnon
        .from(table)
        .select('count()', { count: 'exact', head: true });
      
      // For regular users, some tables might legitimately return permission denied
      // based on RLS policies, which is expected behavior
      if (error && error.message.includes('permission denied')) {
        console.log(`  ℹ️  ${table}: Permission denied (expected for some tables)`);
      } else if (error) {
        console.log(`  ❌ ${table}: ${error.message}`);
        anonUserSuccess = false;
      } else {
        console.log(`  ✅ ${table}: Accessible (${data.length} rows)`);
      }
    } catch (error) {
      console.log(`  ❌ ${table}: ${error.message}`);
      anonUserSuccess = false;
    }
  }
  
  console.log(`\\nRegular User Access: ${anonUserSuccess ? '✅ SUCCESS' : '❌ FAILED'}\\n`);
}

// Test 3: Check specific statement periods access
console.log('3️⃣ Testing Statement Periods Access');
if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Missing Supabase configuration\\n');
} else {
  const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const { data, error } = await supabaseService
      .from('customer_statement_periods')
      .select('id, customer_id, period_start, period_end')
      .limit(1);
    
    if (error) {
      console.log(`  ❌ Statement periods access failed: ${error.message}`);
    } else {
      console.log(`  ✅ Statement periods accessible: ${data.length} records found`);
      if (data.length > 0) {
        console.log(`    Sample record:`, JSON.stringify(data[0], null, 2));
      }
    }
  } catch (error) {
    console.log(`  ❌ Statement periods access failed: ${error.message}`);
  }
}

// Test 4: Check RLS status
console.log('\\n4️⃣ Checking RLS Status');
if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Missing Supabase configuration\\n');
} else {
  const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const { data, error } = await supabaseService.rpc('execute_sql', {
      query: `
        SELECT 
          tablename,
          relrowsecurity as rls_enabled
        FROM pg_tables t
        JOIN pg_class c ON t.tablename = c.relname
        WHERE t.tablename IN (
          'appUsers', 'customers', 'jobs', 'invoices', 'payments',
          'customer_statement_periods', 'customer_statement_transactions',
          'customer_account_balances', 'statement_settings'
        )
        ORDER BY tablename
      `
    });
    
    if (error) {
      console.log(`  ❌ Could not check RLS status: ${error.message}`);
    } else {
      console.log('  RLS Status:');
      data.forEach(table => {
        console.log(`    ${table.tablename}: ${table.rls_enabled ? 'Enabled ✅' : 'Disabled ❌'}`);
      });
    }
  } catch (error) {
    console.log(`  ❌ Could not check RLS status: ${error.message}`);
  }
}

console.log('\\n🏁 Verification Complete');
console.log('\\nIf all tests show ✅ SUCCESS, your database solution is working correctly.');
console.log('The "Error fetching statement periods: {}" should now be resolved.');