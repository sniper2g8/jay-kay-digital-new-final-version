/**
 * Script to check current RLS status for notification tables
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkRLSStatus() {
  console.log('Checking RLS status for notification tables...\n');
  
  const tables = ['notifications', 'appUsers', 'notification_preferences'];
  
  for (const table of tables) {
    console.log(`🔍 Checking ${table} table...`);
    
    try {
      // Check if RLS is enabled
      const { data: rlsData, error: rlsError } = await supabase
        .from('information_schema.tables')
        .select('table_name, is_insertable_into')
        .eq('table_name', table)
        .single();
      
      if (rlsError) {
        console.log(`  ℹ️  Could not check RLS status directly: ${rlsError.message}`);
      } else {
        console.log(`  Table: ${rlsData?.table_name}`);
      }
      
      // Try to access the table with a simple query
      const { data, error } = await supabase
        .from(table)
        .select('count()')
        .limit(1);
        
      if (error) {
        console.log(`  ❌ Access denied: ${error.message}`);
      } else {
        console.log(`  ✅ Access granted`);
      }
      
    } catch (error) {
      console.log(`  ❌ Exception: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }
}

checkRLSStatus().catch(console.error);