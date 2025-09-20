/**
 * Simple script to check RLS status
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

async function simpleCheck() {
  console.log('Simple RLS check...\n');
  
  try {
    // Try to access notifications table
    console.log('1. Trying to access notifications table...');
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .limit(1);
      
    if (error) {
      console.log(`  ❌ Error: ${error.message}`);
      console.log(`  Code: ${error.code}`);
    } else {
      console.log('  ✅ Success');
    }
  } catch (error) {
    console.log(`  ❌ Exception: ${error.message}`);
  }
  
  try {
    // Try to access appUsers table
    console.log('\n2. Trying to access appUsers table...');
    const { data, error } = await supabase
      .from('appUsers')
      .select('*')
      .limit(1);
      
    if (error) {
      console.log(`  ❌ Error: ${error.message}`);
      console.log(`  Code: ${error.code}`);
    } else {
      console.log('  ✅ Success');
    }
  } catch (error) {
    console.log(`  ❌ Exception: ${error.message}`);
  }
}

simpleCheck().catch(console.error);