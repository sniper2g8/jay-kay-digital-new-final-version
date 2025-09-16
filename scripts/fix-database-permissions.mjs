import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Database Permissions Fix Script');
console.log('==================================');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTableAccess(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);
    
    if (error) {
      return { accessible: false, error: error.message };
    }
    return { accessible: true, count: data?.length || 0 };
  } catch (err) {
    return { accessible: false, error: err.message };
  }
}

async function checkDatabasePermissions() {
  console.log('🔍 Checking database permissions...\n');
  
  const tables = [
    'customers',
    'jobs',
    'invoices',
    'payments',
    'appUsers',
    'roles',
    'permissions',
    'services',
    'inventory',
    'paper_sizes',
    'paper_weights',
    'paper_types',
    'finish_options'
  ];
  
  const results = {};
  
  for (const table of tables) {
    const result = await testTableAccess(table);
    results[table] = result;
    
    if (result.accessible) {
      console.log(`✅ ${table}: Accessible (${result.count} records)`);
    } else {
      console.log(`❌ ${table}: ${result.error}`);
    }
  }
  
  console.log('\n📋 Summary:');
  const accessibleTables = Object.keys(results).filter(table => results[table].accessible);
  const inaccessibleTables = Object.keys(results).filter(table => !results[table].accessible);
  
  console.log(`✅ ${accessibleTables.length} tables accessible`);
  console.log(`❌ ${inaccessibleTables.length} tables inaccessible`);
  
  if (inaccessibleTables.length > 0) {
    console.log('\n🔧 To fix permissions, please run these SQL scripts in your Supabase dashboard:');
    console.log('1. fix-rls-policies.sql - Fixes Row Level Security policies');
    console.log('2. populate_finish_options.sql - Populates finish options data');
    console.log('\n📝 Instructions:');
    console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Navigate to SQL Editor');
    console.log('4. Copy and paste each SQL file content');
    console.log('5. Click "Run" to execute each migration');
  } else {
    console.log('\n🎉 All tables are accessible! Database permissions are properly configured.');
  }
  
  return { accessibleTables, inaccessibleTables };
}

// Run the permission check
checkDatabasePermissions().catch(console.error);