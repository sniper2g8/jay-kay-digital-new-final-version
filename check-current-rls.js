import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local
const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Use service key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCurrentRLS() {
  console.log('=== Checking Current RLS Policies ===');
  
  try {
    // Check if RLS is enabled on jobs table
    console.log('1. Checking if RLS is enabled on jobs table...');
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('get_rls_status', { table_name: 'jobs' });
      
    if (rlsError) {
      console.log('   Could not check RLS status via RPC, trying direct query...');
      // Alternative method to check RLS status
      const { data: tableInfo, error: tableError } = await supabase
        .from('pg_tables')
        .select('*')
        .eq('tablename', 'jobs')
        .single();
        
      if (tableError) {
        console.error('❌ Error checking table info:', tableError);
      } else {
        console.log('   Table info retrieved');
      }
    } else {
      console.log('   RLS Status:', rlsStatus);
    }
    
    // Check current policies on jobs table
    console.log('2. Checking current policies on jobs table...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'jobs');
      
    if (policiesError) {
      console.error('❌ Error fetching policies:', policiesError);
    } else {
      if (policies && policies.length > 0) {
        console.log(`   Found ${policies.length} policies:`);
        policies.forEach(policy => {
          console.log(`   - ${policy.policyname} (${policy.permissive} ${policy.cmd})`);
          console.log(`     Using: ${policy.qual}`);
          console.log(`     With Check: ${policy.with_check}`);
        });
      } else {
        console.log('   ❌ No policies found on jobs table');
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkCurrentRLS().catch(console.error);