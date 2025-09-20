/**
 * Script to check actual table names in the database
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

async function checkTableNames() {
  console.log('Checking actual table names...\n');
  
  // List of potential table names we're interested in
  const potentialTables = [
    'appUsers', 'app_users', 'app-user', 'app_user',
    'notifications', 'notification',
    'notification_preferences', 'notification-preferences', 'notificationPreference', 'notification_preference'
  ];
  
  for (const tableName of potentialTables) {
    try {
      console.log(`Checking table: ${tableName}`);
      const { data, error } = await supabase
        .from(tableName)
        .select('count()')
        .limit(1);
        
      if (error) {
        if (error.code === '42P01') {
          console.log(`  ❌ Table does not exist: ${tableName}`);
        } else {
          console.log(`  ❌ Error: ${error.message}`);
        }
      } else {
        console.log(`  ✅ Table exists: ${tableName}`);
      }
    } catch (error) {
      console.log(`  ❌ Exception: ${error.message}`);
    }
  }
  
  console.log('\nTrying to list all tables...');
  try {
    // Try to get all table names from information schema
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
      
    if (error) {
      console.log(`Error getting table list: ${error.message}`);
    } else {
      console.log('Available tables in public schema:');
      data.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    }
  } catch (error) {
    console.log(`Exception getting table list: ${error.message}`);
  }
}

checkTableNames().catch(console.error);