/**
 * Comprehensive database connection test script
 * Tests both Supabase client and direct PostgreSQL connection
 */

import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Direct PostgreSQL configuration
const SUPABASE_PROJECT_ID = 'pnoxqzlxfuvjvufdjuqh';
const DB_USER = `postgres.${SUPABASE_PROJECT_ID}`;
const DB_HOST = 'aws-0-us-west-1.pooler.supabase.com';
const DB_PORT = '6543';
const DB_NAME = 'postgres';
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || '';

console.log('🧪 Comprehensive Database Connection Test\\n');

// Test 1: Supabase client with anon key
console.log('1️⃣ Testing Supabase client with anon key...');
if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Missing Supabase URL or anon key\\n');
} else {
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Test appUsers access
    const { data: appUsersData, error: appUsersError } = await supabaseAnon
      .from('appUsers')
      .select('count()', { count: 'exact' });
    
    if (appUsersError) {
      console.log(`❌ appUsers access failed: ${appUsersError.message}\\n`);
    } else {
      console.log(`✅ appUsers accessible: ${appUsersData.length} records\\n`);
    }
  } catch (error) {
    console.log(`❌ Supabase anon client test failed: ${error.message}\\n`);
  }
}

// Test 2: Supabase client with service role key
console.log('2️⃣ Testing Supabase client with service role key...');
if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Missing Supabase URL or service role key\\n');
} else {
  const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Test appUsers access
    const { data: appUsersData, error: appUsersError } = await supabaseService
      .from('appUsers')
      .select('count()', { count: 'exact' });
    
    if (appUsersError) {
      console.log(`❌ appUsers access failed: ${appUsersError.message}\\n`);
    } else {
      console.log(`✅ appUsers accessible: ${appUsersData.length} records\\n`);
    }
    
    // Test customers access
    const { data: customersData, error: customersError } = await supabaseService
      .from('customers')
      .select('count()', { count: 'exact' });
    
    if (customersError) {
      console.log(`❌ customers access failed: ${customersError.message}\\n`);
    } else {
      console.log(`✅ customers accessible: ${customersData.length} records\\n`);
    }
    
    // Test statement periods access
    const { data: statementData, error: statementError } = await supabaseService
      .from('customer_statement_periods')
      .select('count()', { count: 'exact' });
    
    if (statementError) {
      console.log(`❌ customer_statement_periods access failed: ${statementError.message}\\n`);
    } else {
      console.log(`✅ customer_statement_periods accessible: ${statementData.length} records\\n`);
    }
  } catch (error) {
    console.log(`❌ Supabase service role client test failed: ${error.message}\\n`);
  }
}

// Test 3: Direct PostgreSQL connection
console.log('3️⃣ Testing direct PostgreSQL connection...');
if (!DB_PASSWORD) {
  console.log('❌ Missing database password\\n');
} else {
  const connectionString = `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
  
  const { Client } = pg;
  const pgClient = new Client({
    connectionString: connectionString,
  });
  
  try {
    await pgClient.connect();
    console.log('✅ Connected to PostgreSQL database!\\n');
    
    // Test appUsers access
    try {
      const appUsersResult = await pgClient.query('SELECT COUNT(*) FROM appUsers');
      console.log(`✅ appUsers table accessible: ${appUsersResult.rows[0].count} records`);
    } catch (error) {
      console.log(`❌ appUsers table access failed: ${error.message}`);
    }
    
    // Test customers access
    try {
      const customersResult = await pgClient.query('SELECT COUNT(*) FROM customers');
      console.log(`✅ customers table accessible: ${customersResult.rows[0].count} records`);
    } catch (error) {
      console.log(`❌ customers table access failed: ${error.message}`);
    }
    
    // Test statement periods access
    try {
      const statementResult = await pgClient.query('SELECT COUNT(*) FROM customer_statement_periods');
      console.log(`✅ customer_statement_periods table accessible: ${statementResult.rows[0].count} records`);
    } catch (error) {
      console.log(`❌ customer_statement_periods table access failed: ${error.message}`);
    }
    
    await pgClient.end();
    console.log('\\n🔌 Disconnected from database');
  } catch (error) {
    console.log(`❌ PostgreSQL connection failed: ${error.message}\\n`);
  }
}

console.log('\\n🏁 Database connection tests completed');