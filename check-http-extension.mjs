#!/usr/bin/env node

/**
 * Script to check if HTTP extension is available in Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Checking HTTP extension availability...');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkHttpExtension() {
  try {
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
      return;
    }
    
    if (schemaData && schemaData.length > 0) {
      console.log('✅ Extensions schema exists');
    } else {
      console.log('❌ Extensions schema does not exist');
      return;
    }
    
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
      return;
    }
    
    if (extensionData && extensionData.length > 0) {
      const ext = extensionData[0];
      if (ext.installed_version) {
        console.log(`✅ HTTP extension is installed (version ${ext.installed_version})`);
        
        // Check if http_post function exists
        console.log('\n3. Checking if http_post function exists...');
        const { data: functionData, error: functionError } = await supabase.rpc('exec_sql', {
          sql_query: `
            SELECT proname, pronamespace::regnamespace as schema_name
            FROM pg_proc
            WHERE proname = 'http_post';
          `
        });
        
        if (functionError) {
          console.error('❌ Error checking http_post function:', functionError);
          return;
        }
        
        if (functionData && functionData.length > 0) {
          console.log('✅ http_post function exists');
          console.log('   Function location:', functionData[0].schema_name);
          
          // If it exists in extensions schema, we can use it
          if (functionData[0].schema_name === 'extensions') {
            console.log('✅ HTTP extension is properly configured and ready to use!');
            console.log('\n📝 You can now use extensions.http_post() in your database functions.');
          } else {
            console.log('⚠️  http_post function exists but in a different schema');
            console.log('   Schema:', functionData[0].schema_name);
          }
        } else {
          console.log('❌ http_post function not found');
        }
      } else {
        console.log('❌ HTTP extension is available but not installed');
        console.log('   You may need to contact Supabase support to enable it for your project');
      }
    } else {
      console.log('❌ HTTP extension is not available in your Supabase instance');
      console.log('   This may be because you are on a free tier that does not include the HTTP extension');
      console.log('   Consider upgrading your Supabase plan or using application-level notifications');
    }
    
    console.log('\n📋 Summary:');
    console.log('   - Extensions schema: ✅ Exists');
    console.log(`   - HTTP extension: ${extensionData && extensionData.length > 0 && extensionData[0].installed_version ? '✅ Installed' : '❌ Not installed'}`);
    console.log(`   - http_post function: ${functionData && functionData.length > 0 ? '✅ Exists' : '❌ Not found'}`);
    
  } catch (error) {
    console.error('❌ Error checking HTTP extension:', error);
  }
}

// Run the script
checkHttpExtension();