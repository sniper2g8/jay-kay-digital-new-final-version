#!/usr/bin/env node

/**
 * Script to run email notification fix migrations in the correct order
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

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

// Migration files in order
const migrationFiles = [
  '20250102_enable_http_extension.sql',
  '20250101_update_email_notifications.sql',
  '20241231_email_notifications.sql'
];

async function runMigrations() {
  console.log('🚀 Running email notification fix migrations...');
  
  try {
    for (const file of migrationFiles) {
      const filePath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'supabase', 'migrations', file);
      
      try {
        console.log(`\n📝 Running migration: ${file}`);
        
        // Read the migration file
        const sql = await fs.readFile(filePath, 'utf8');
        
        // Execute the migration
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: sql
        });
        
        if (error) {
          console.error(`❌ Error running migration ${file}:`, error);
          throw error;
        }
        
        console.log(`✅ Migration ${file} completed successfully`);
      } catch (fileError) {
        console.error(`❌ Failed to read or execute migration ${file}:`, fileError);
        throw fileError;
      }
    }
    
    console.log('\n🎉 All migrations completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Test job status updates to verify the fix');
    console.log('2. Check Supabase function logs for any remaining issues');
    console.log('3. Redeploy your Supabase functions if needed');
    
  } catch (error) {
    console.error('❌ Migration process failed:', error);
    process.exit(1);
  }
}

// Run the script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations();
}

export { runMigrations };