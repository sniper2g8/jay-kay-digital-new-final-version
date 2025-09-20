#!/usr/bin/env node

/**
 * Test script to verify HTTP extension is working in Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testHttpExtension() {
  console.log('🔍 Testing HTTP extension in Supabase database...');
  
  try {
    // Test 1: Check if extensions schema exists
    console.log('\n1. Checking if extensions schema exists...');
    const { data: schemaData, error: schemaError } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name = 'extensions';
      `
    });
    
    if (schemaError) {
      console.error('❌ Error checking extensions schema:', schemaError);
      throw schemaError;
    }
    
    if (schemaData && schemaData.length > 0) {
      console.log('✅ Extensions schema exists');
    } else {
      console.log('❌ Extensions schema does not exist');
    }
    
    // Test 2: Check if http extension is installed
    console.log('\n2. Checking if HTTP extension is installed...');
    const { data: extensionData, error: extensionError } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT name, default_version, installed_version
        FROM pg_available_extensions
        WHERE name = 'http';
      `
    });
    
    if (extensionError) {
      console.error('❌ Error checking HTTP extension:', extensionError);
      throw extensionError;
    }
    
    if (extensionData && extensionData.length > 0) {
      const ext = extensionData[0];
      if (ext.installed_version) {
        console.log(`✅ HTTP extension is installed (version ${ext.installed_version})`);
      } else {
        console.log('❌ HTTP extension is not installed');
      }
    } else {
      console.log('❌ HTTP extension not found');
    }
    
    // Test 3: Check if http_post function exists in extensions schema
    console.log('\n3. Checking if http_post function exists in extensions schema...');
    const { data: functionData, error: functionError } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT proname, pronamespace::regnamespace as schema_name
        FROM pg_proc
        WHERE proname = 'http_post'
        AND pronamespace::regnamespace = 'extensions';
      `
    });
    
    if (functionError) {
      console.error('❌ Error checking http_post function:', functionError);
      throw functionError;
    }
    
    if (functionData && functionData.length > 0) {
      console.log('✅ http_post function exists in extensions schema');
    } else {
      console.log('❌ http_post function not found in extensions schema');
    }
    
    // Test 4: Try to execute a simple HTTP request (be careful with this)
    console.log('\n4. Testing HTTP functionality...');
    console.log('ℹ️  Skipping actual HTTP request test to avoid side effects');
    console.log('✅ HTTP extension test completed');
    
    console.log('\n🎉 HTTP extension verification completed!');
    
  } catch (error) {
    console.error('❌ HTTP extension test failed:', error);
    process.exit(1);
  }
}

// Run the script
if (process.argv[1] === import.meta.url) {
  testHttpExtension();
}

export { testHttpExtension };