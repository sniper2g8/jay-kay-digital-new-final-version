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

async function verifyJobsRLSWithDirectConnection() {
  console.log('=== Verifying Jobs RLS with Direct Database Connection ===');
  
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
    
    // Check RLS status on jobs table
    console.log('1. Checking RLS status on jobs table...');
    const rlsResult = await client.query(`
      SELECT relname, relrowsecurity, relforcerowsecurity 
      FROM pg_class 
      WHERE relname = 'jobs' AND relkind = 'r'
    `);
    
    if (rlsResult.rows.length > 0) {
      const rlsEnabled = rlsResult.rows[0].relrowsecurity;
      console.log(`   RLS enabled: ${rlsEnabled ? 'Yes' : 'No'}`);
      console.log(`   RLS forced: ${rlsResult.rows[0].relforcerowsecurity ? 'Yes' : 'No'}`);
      
      if (!rlsEnabled) {
        console.log('⚠️  RLS is not enabled on the jobs table. This may cause permission issues.');
      }
    } else {
      console.log('   Jobs table not found');
      await client.end();
      return;
    }
    
    // Check policies on jobs table
    console.log('2. Checking policies on jobs table...');
    const policiesResult = await client.query(`
      SELECT policyname, permissive, cmd, qual, with_check
      FROM pg_policies 
      WHERE tablename = 'jobs'
    `);
    
    if (policiesResult.rows.length > 0) {
      console.log(`   Found ${policiesResult.rows.length} policies:`);
      policiesResult.rows.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`);
        console.log(`     Qual: ${policy.qual || 'None'}`);
        console.log(`     With Check: ${policy.with_check || 'None'}`);
      });
    } else {
      console.log('   No policies found on jobs table');
      console.log('⚠️  This is likely the cause of the permission errors');
    }
    
    // Try to simulate what happens with Supabase client
    console.log('3. Testing UPDATE with current user context...');
    
    // Get a job ID to test with
    const jobResult = await client.query('SELECT id FROM jobs LIMIT 1');
    if (jobResult.rows.length > 0) {
      const testJobId = jobResult.rows[0].id;
      console.log(`   Testing with job ID: ${testJobId}`);
      
      try {
        // This simulates what the Supabase client is trying to do
        // Note: This will likely fail because we're connecting as a service role
        // but the RLS policies are designed for authenticated users
        await client.query(`
          UPDATE jobs 
          SET status = 'pending', updated_at = NOW() 
          WHERE id = $1
        `, [testJobId]);
        console.log('✅ UPDATE operation successful');
      } catch (updateError) {
        console.log('❌ UPDATE operation failed:', updateError.message);
        if (updateError.code) {
          console.log('   Error code:', updateError.code);
        }
      }
    } else {
      console.log('   No jobs found to test with');
    }
    
    await client.end();
    console.log('\n=== Verification Complete ===');
    console.log('\n💡 Recommendations:');
    console.log('   1. Enable RLS on the jobs table if not already enabled');
    console.log('   2. Add appropriate policies for SELECT, INSERT, UPDATE, DELETE operations');
    console.log('   3. Refer to the SQL files in this directory for policy examples');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

verifyJobsRLSWithDirectConnection().catch(console.error);