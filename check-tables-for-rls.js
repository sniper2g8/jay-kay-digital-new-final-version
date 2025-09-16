// Check existing tables to determine which RLS policies are needed
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
  // No SSL configuration needed for direct connection
});

async function checkTablesForRLS() {
  let client;
  try {
    client = await pool.connect();
    
    console.log('🔍 Checking Existing Tables for RLS Policy Creation...');
    console.log('=======================================================');
    
    // Check what tables exist
    const tablesResult = await client.query(`
      SELECT 
        table_name,
        table_type,
        CASE 
          WHEN table_name = 'appUsers' THEN 'CRITICAL - Main user accounts'
          WHEN table_name = 'customers' THEN 'CRITICAL - Business entities' 
          WHEN table_name = 'profiles' THEN 'CRITICAL - Auth compatibility view'
          WHEN table_name = 'jobs' THEN 'BUSINESS - Print jobs'
          WHEN table_name = 'finances' THEN 'SENSITIVE - Financial data'
          WHEN table_name = 'orders' THEN 'BUSINESS - Customer orders'
          ELSE 'OTHER'
        END as importance,
        EXISTS(
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_type = 'PRIMARY KEY' 
          AND table_name = t.table_name
        ) as has_primary_key
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY 
        CASE 
          WHEN table_name IN ('appUsers', 'customers', 'profiles') THEN 1
          WHEN table_name IN ('jobs', 'finances', 'orders') THEN 2
          ELSE 3
        END,
        table_name
    `);
    
    console.log('\n📊 Tables Found:');
    console.log('================');
    tablesResult.rows.forEach(table => {
      console.log(`${table.table_name.padEnd(20)} | ${table.importance.padEnd(25)} | PK: ${table.has_primary_key ? '✅' : '❌'}`);
    });
    
    // Check current RLS status
    const rlsResult = await client.query(`
      SELECT 
        tablename,
        rowsecurity as rls_enabled,
        hasrls as has_policies
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    console.log('\n🔒 Current RLS Status:');
    console.log('=====================');
    rlsResult.rows.forEach(table => {
      const rlsStatus = table.rls_enabled ? '✅ ENABLED' : '❌ DISABLED';
      const policyStatus = table.has_policies ? '✅ HAS POLICIES' : '❌ NO POLICIES';
      console.log(`${table.tablename.padEnd(20)} | RLS: ${rlsStatus.padEnd(12)} | Policies: ${policyStatus}`);
    });
    
    // Check existing policies
    const policiesResult = await client.query(`
      SELECT 
        tablename,
        policyname,
        cmd as operation,
        permissive
      FROM pg_policies 
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname
    `);
    
    if (policiesResult.rows.length > 0) {
      console.log('\n📋 Existing Policies:');
      console.log('====================');
      let currentTable = '';
      policiesResult.rows.forEach(policy => {
        if (policy.tablename !== currentTable) {
          console.log(`\n${policy.tablename}:`);
          currentTable = policy.tablename;
        }
        console.log(`  - ${policy.policyname} (${policy.operation})`);
      });
    } else {
      console.log('\n❌ No policies found - all were dropped during debugging');
    }
    
    console.log('\n🎯 Recommended Action:');
    console.log('=====================');
    console.log('1. Run restore-rls-policies.sql to restore security');
    console.log('2. Test authentication and data access');
    console.log('3. Verify users can only see their own data');
    console.log('4. Confirm admins can access all data');
    
  } catch (err) {
    console.error('💥 Error:', err.message);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

checkTablesForRLS();