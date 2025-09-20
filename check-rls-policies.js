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
  console.log('Need SUPABASE_SERVICE_ROLE_KEY for admin access');
  process.exit(1);
}

// Use service key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLSPolicies() {
  console.log('=== Checking RLS Policies for Notifications Table ===');
  
  // Check if RLS is enabled on notifications table
  const { data: rlsStatus, error: rlsError } = await supabase
    .from('information_schema.tables')
    .select('table_name, row_security')
    .eq('table_schema', 'public')
    .eq('table_name', 'notifications');
    
  if (rlsError) {
    console.error('Error checking RLS status:', rlsError);
  } else {
    console.log('RLS Status:', rlsStatus);
  }
  
  // Check policies on notifications table
  const { data: policies, error: policiesError } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'notifications');
    
  if (policiesError) {
    console.error('Error fetching policies:', policiesError);
  } else {
    console.log('Policies on notifications table:');
    if (policies.length === 0) {
      console.log('No policies found');
    } else {
      policies.forEach(policy => {
        console.log(`- ${policy.policyname}: ${policy.permissive} ${policy.cmd} (${policy.roles.join(', ')})`);
        console.log(`  Using: ${policy.qual}`);
      });
    }
  }
  
  // Check table privileges
  console.log('\n--- Checking Table Privileges ---');
  try {
    const { data: privileges, error: privError } = await supabase
      .from('information_schema.table_privileges')
      .select('*')
      .eq('table_name', 'notifications')
      .eq('table_schema', 'public');
      
    if (privError) {
      console.error('Error checking privileges:', privError);
    } else {
      console.log('Table privileges:');
      privileges.forEach(priv => {
        console.log(`- ${priv.grantee} has ${priv.privilege_type} privilege`);
      });
    }
  } catch (error) {
    console.error('Error checking table privileges:', error);
  }
}

checkRLSPolicies().catch(console.error);