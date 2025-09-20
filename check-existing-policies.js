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

async function checkExistingPolicies() {
  console.log('=== Checking Existing Policies ===');
  
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
    
    // Check existing policies on jobs table
    console.log('1. Checking existing policies on jobs table...');
    const policiesResult = await client.query(`
      SELECT policyname, permissive, cmd, qual, with_check
      FROM pg_policies 
      WHERE tablename = 'jobs'
    `);
    
    if (policiesResult.rows.length > 0) {
      console.log(`   Found ${policiesResult.rows.length} policies:`);
      policiesResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.policyname} (${row.cmd})`);
        console.log(`      Qual: ${row.qual || 'None'}`);
        console.log(`      With Check: ${row.with_check || 'None'}`);
        console.log('');
      });
    } else {
      console.log('   No policies found on jobs table');
    }
    
    // Check if RLS is enabled
    console.log('2. Checking RLS status...');
    const rlsResult = await client.query(`
      SELECT relname, relrowsecurity, relforcerowsecurity 
      FROM pg_class 
      WHERE relname = 'jobs' AND relkind = 'r'
    `);
    
    if (rlsResult.rows.length > 0) {
      const rlsEnabled = rlsResult.rows[0].relrowsecurity;
      console.log(`   RLS enabled: ${rlsEnabled ? 'Yes' : 'No'}`);
      console.log(`   RLS forced: ${rlsResult.rows[0].relforcerowsecurity ? 'Yes' : 'No'}`);
    }
    
    await client.end();
    console.log('\n=== Policy Check Complete ===');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

checkExistingPolicies().catch(console.error);