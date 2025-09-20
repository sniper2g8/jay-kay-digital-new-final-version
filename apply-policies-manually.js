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

async function applyPoliciesManually() {
  console.log('=== Applying Policies Manually ===');
  
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
    
    // Apply INSERT policy
    console.log('1. Applying INSERT policy...');
    try {
      await client.query(`
        CREATE POLICY "Staff can create jobs" 
        ON jobs 
        FOR INSERT 
        WITH CHECK (
          auth.role() = 'authenticated' AND 
          EXISTS (
            SELECT 1 FROM "appUsers" 
            WHERE id = auth.uid() AND 
            primary_role IN ('admin', 'staff', 'manager', 'super_admin')
          )
        )
      `);
      console.log('   ✅ INSERT policy applied successfully');
    } catch (error) {
      console.error('   ❌ INSERT policy failed:', error.message);
    }
    
    // Apply DELETE policy
    console.log('2. Applying DELETE policy...');
    try {
      await client.query(`
        CREATE POLICY "Admins can delete jobs" 
        ON jobs 
        FOR DELETE 
        USING (
          auth.role() = 'authenticated' AND 
          EXISTS (
            SELECT 1 FROM "appUsers" 
            WHERE id = auth.uid() AND 
            primary_role IN ('admin', 'super_admin')
          )
        )
      `);
      console.log('   ✅ DELETE policy applied successfully');
    } catch (error) {
      console.error('   ❌ DELETE policy failed:', error.message);
    }
    
    // Verify the policies
    console.log('3. Verifying all policies...');
    const policiesResult = await client.query(`
      SELECT policyname, cmd FROM pg_policies WHERE tablename = 'jobs'
    `);
    
    console.log('   Current policies:');
    policiesResult.rows.forEach(row => {
      console.log(`   - ${row.policyname} (${row.cmd})`);
    });
    
    await client.end();
    console.log('\n=== Manual Policy Application Complete ===');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

applyPoliciesManually().catch(console.error);