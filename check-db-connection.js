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

async function checkDatabaseConnection() {
  console.log('=== Database Connection Check ===');
  
  // Get database URL from environment variables
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in .env.local');
    process.exit(1);
  }
  
  console.log('✅ Found DATABASE_URL in .env.local');
  
  // Try to connect using the database URL directly
  const client = new Client({
    connectionString: databaseUrl,
  });
  
  try {
    console.log('1. Testing direct database connection...');
    await client.connect();
    console.log('✅ Direct database connection successful');
    
    // Test a simple query
    console.log('2. Testing simple query...');
    const result = await client.query('SELECT version()');
    console.log('✅ Simple query successful');
    console.log('   PostgreSQL version:', result.rows[0].version);
    
    // Test access to jobs table
    console.log('3. Testing jobs table access...');
    const jobsResult = await client.query('SELECT COUNT(*) FROM jobs');
    console.log('✅ Jobs table access successful');
    console.log('   Jobs count:', jobsResult.rows[0].count);
    
    // Check RLS status on jobs table
    console.log('4. Checking RLS status on jobs table...');
    const rlsResult = await client.query(`
      SELECT relname, relrowsecurity, relforcerowsecurity 
      FROM pg_class 
      WHERE relname = 'jobs' AND relkind = 'r'
    `);
    
    if (rlsResult.rows.length > 0) {
      const rlsEnabled = rlsResult.rows[0].relrowsecurity;
      console.log(`   RLS enabled: ${rlsEnabled ? 'Yes' : 'No'}`);
      console.log(`   RLS forced: ${rlsResult.rows[0].relforcerowsecurity ? 'Yes' : 'No'}`);
    } else {
      console.log('   Jobs table not found');
    }
    
    // Check policies on jobs table
    console.log('5. Checking policies on jobs table...');
    const policiesResult = await client.query(`
      SELECT policyname, permissive, cmd, qual, with_check
      FROM pg_policies 
      WHERE tablename = 'jobs'
    `);
    
    if (policiesResult.rows.length > 0) {
      console.log(`   Found ${policiesResult.rows.length} policies:`);
      policiesResult.rows.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`);
      });
    } else {
      console.log('   No policies found on jobs table');
    }
    
    await client.end();
    console.log('\n=== Database Connection Check Complete ===');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    // Try to provide more specific error information
    if (error.code) {
      console.error('   Error code:', error.code);
    }
    
    if (error.detail) {
      console.error('   Detail:', error.detail);
    }
    
    await client.end().catch(() => {});
    process.exit(1);
  }
}

checkDatabaseConnection().catch(console.error);