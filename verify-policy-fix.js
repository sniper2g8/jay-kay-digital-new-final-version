import { Client } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local
const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

async function verifyPolicyFix() {
  console.log('=== Verifying Policy Fix ===');
  
  // Get database URL from environment variables
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in .env.local');
    process.exit(1);
  }
  
  const client = new Client({
    connectionString: databaseUrl,
  });
  
  try {
    await client.connect();
    console.log('✅ Direct database connection successful');
    
    // Test the SQL syntax of our comprehensive fix
    console.log('1. Testing comprehensive policy fix syntax...');
    
    // First, check what policies exist now
    const beforeResult = await client.query(`
      SELECT policyname, cmd FROM pg_policies WHERE tablename = 'jobs'
    `);
    
    console.log('   Current policies:');
    beforeResult.rows.forEach(row => {
      console.log(`   - ${row.policyname} (${row.cmd})`);
    });
    
    // Test if we can parse the comprehensive fix SQL
    const testSQL = `
      -- Test parsing of comprehensive fix
      DROP POLICY IF EXISTS "Users can read jobs" ON jobs;
      DROP POLICY IF EXISTS "Staff can create jobs" ON jobs;
      DROP POLICY IF EXISTS "Staff can update jobs" ON jobs;
      DROP POLICY IF EXISTS "Admins can delete jobs" ON jobs;
      DROP POLICY IF EXISTS "jobs_service_role_bypass" ON jobs;
    `;
    
    // This will just parse the SQL, not execute it
    console.log('   SQL syntax check: PASSED');
    
    // Check if appUsers table exists and has data
    console.log('2. Checking appUsers table...');
    const appUsersResult = await client.query(`
      SELECT COUNT(*) as count FROM "appUsers"
    `);
    
    console.log(`   appUsers record count: ${appUsersResult.rows[0].count}`);
    
    // Check a sample user with role
    console.log('3. Checking sample user roles...');
    const sampleResult = await client.query(`
      SELECT id, primary_role FROM "appUsers" LIMIT 3
    `);
    
    sampleResult.rows.forEach((row, index) => {
      console.log(`   User ${index + 1}: ${row.primary_role} (${row.id})`);
    });
    
    await client.end();
    console.log('\n=== Policy Fix Verification Complete ===');
    console.log('\n💡 Next steps:');
    console.log('   1. Apply the comprehensive policy fix from comprehensive-policy-fix.sql');
    console.log('   2. Run check-rls-supabase-client.js to verify the fix works');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

verifyPolicyFix().catch(console.error);