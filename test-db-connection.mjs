#!/usr/bin/env node

/**
 * Simple test script to verify database connection
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Service Key exists:', !!supabaseServiceKey);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    // Simple query to test connection
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: 'SELECT version();'
    });
    
    if (error) {
      console.error('❌ Connection test failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Database connection successful!');
    console.log('PostgreSQL version:', data[0].version);
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    process.exit(1);
  }
}

// Run the script
testConnection();