/**
 * Script to check current RLS policies and table ownership
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLSAndOwnership() {
  console.log('🔍 Checking RLS policies and table ownership...\\n');
  
  // Check RLS status for key tables
  const tables = [
    'appUsers',
    'customers',
    'jobs',
    'invoices',
    'payments',
    'customer_statement_periods',
    'customer_statement_transactions',
    'customer_account_balances',
    'statement_settings',
    'notifications'
  ];
  
  for (const table of tables) {
    console.log(`📋 Checking ${table}...`);
    
    try {
      // Check if table exists and get row count
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.log(`  ❌ Table access error: ${countError.message}`);
        continue;
      }
      
      console.log(`  ✅ Table exists with ${count} rows`);
      
      // Check RLS status using SQL query
      const { data: rlsData, error: rlsError } = await supabase.rpc('execute_sql', {
        query: `
          SELECT 
            tablename,
            relrowsecurity as rls_enabled,
            relforcerowsecurity as rls_forced
          FROM pg_tables t
          JOIN pg_class c ON t.tablename = c.relname
          WHERE t.tablename = '${table}'
        `
      });
      
      if (rlsError) {
        console.log(`  ℹ️  Could not check RLS status: ${rlsError.message}`);
      } else if (rlsData && rlsData.length > 0) {
        const rlsStatus = rlsData[0];
        console.log(`  🔐 RLS enabled: ${rlsStatus.rls_enabled ? 'Yes' : 'No'}`);
        console.log(`  💪 RLS forced: ${rlsStatus.rls_forced ? 'Yes' : 'No'}`);
      }
      
      // Check policies if RLS is enabled
      if (rlsData && rlsData.length > 0 && rlsData[0].rls_enabled) {
        const { data: policiesData, error: policiesError } = await supabase.rpc('execute_sql', {
          query: `
            SELECT 
              policyname,
              permissive,
              roles,
              cmd,
              qual,
              with_check
            FROM pg_policy pol
            JOIN pg_class pc ON pc.oid = pol.polrelid
            WHERE pc.relname = '${table}'
          `
        });
        
        if (policiesError) {
          console.log(`  ℹ️  Could not retrieve policies: ${policiesError.message}`);
        } else if (policiesData && policiesData.length > 0) {
          console.log(`  📋 ${policiesData.length} policies found:`);
          policiesData.forEach(policy => {
            console.log(`    - ${policy.policyname} (${policy.cmd})`);
          });
        } else {
          console.log(`  ⚠️  RLS enabled but no policies found`);
        }
      }
      
    } catch (error) {
      console.log(`  ❌ Error checking ${table}: ${error.message}`);
    }
    
    console.log('');
  }
  
  // Check table ownership
  console.log('🏛️  Checking table ownership...');
  try {
    const { data: ownershipData, error: ownershipError } = await supabase.rpc('execute_sql', {
      query: `
        SELECT 
          tablename,
          tableowner
        FROM pg_tables 
        WHERE tablename IN (${tables.map(t => `'${t}'`).join(',')})
        ORDER BY tablename
      `
    });
    
    if (ownershipError) {
      console.log(`❌ Error checking ownership: ${ownershipError.message}`);
    } else {
      console.log('Table ownership:');
      ownershipData.forEach(table => {
        console.log(`  ${table.tablename}: ${table.tableowner}`);
      });
    }
  } catch (error) {
    console.log(`❌ Error checking ownership: ${error.message}`);
  }
  
  console.log('\\n✅ RLS and ownership check completed');
}

checkRLSAndOwnership();