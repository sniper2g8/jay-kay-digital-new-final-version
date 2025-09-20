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

async function checkUpdatePolicyDetails() {
  console.log('=== Checking UPDATE Policy Details ===');
  
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
    
    // Check the specific UPDATE policy
    console.log('1. Checking UPDATE policy details...');
    const updatePolicyResult = await client.query(`
      SELECT policyname, permissive, cmd, qual, with_check
      FROM pg_policies 
      WHERE tablename = 'jobs' AND cmd = 'UPDATE'
    `);
    
    if (updatePolicyResult.rows.length > 0) {
      const policy = updatePolicyResult.rows[0];
      console.log(`   Policy Name: ${policy.policyname}`);
      console.log(`   Command: ${policy.cmd}`);
      console.log(`   Qual: ${policy.qual}`);
      console.log(`   With Check: ${policy.with_check}`);
    } else {
      console.log('   No UPDATE policy found');
    }
    
    // Check the DELETE policy as well
    console.log('2. Checking DELETE policy details...');
    const deletePolicyResult = await client.query(`
      SELECT policyname, permissive, cmd, qual, with_check
      FROM pg_policies 
      WHERE tablename = 'jobs' AND cmd = 'DELETE'
    `);
    
    if (deletePolicyResult.rows.length > 0) {
      const policy = deletePolicyResult.rows[0];
      console.log(`   Policy Name: ${policy.policyname}`);
      console.log(`   Command: ${policy.cmd}`);
      console.log(`   Qual: ${policy.qual}`);
      console.log(`   With Check: ${policy.with_check}`);
    } else {
      console.log('   No DELETE policy found');
    }
    
    await client.end();
    console.log('\n=== Policy Details Check Complete ===');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

checkUpdatePolicyDetails().catch(console.error);