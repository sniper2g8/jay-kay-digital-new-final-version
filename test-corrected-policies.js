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

async function testCorrectedPolicies() {
  console.log('=== Testing Corrected Policies SQL ===');
  
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
    
    // Test the corrected SQL for checking if appUsers table exists
    console.log('1. Testing appUsers table access...');
    const testResult = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'appUsers'
      ) as table_exists
    `);
    
    console.log(`   appUsers table exists: ${testResult.rows[0].table_exists}`);
    
    // Test a simple query on appUsers
    console.log('2. Testing simple query on appUsers...');
    const appUsersResult = await client.query(`
      SELECT COUNT(*) as count FROM "appUsers"
    `);
    
    console.log(`   appUsers record count: ${appUsersResult.rows[0].count}`);
    
    // Test querying specific roles
    console.log('3. Testing role query...');
    const rolesResult = await client.query(`
      SELECT primary_role, COUNT(*) as count 
      FROM "appUsers" 
      WHERE primary_role IS NOT NULL
      GROUP BY primary_role
    `);
    
    console.log('   Role distribution:');
    rolesResult.rows.forEach(row => {
      console.log(`   - ${row.primary_role}: ${row.count}`);
    });
    
    await client.end();
    console.log('\n=== Test Complete ===');
    console.log('\n💡 You can now use the corrected SQL policies:');
    console.log('   - fix-jobs-rls-policies-corrected.sql (basic policies)');
    console.log('   - fix-jobs-rls-policies-restrictive-corrected.sql (restrictive policies)');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

testCorrectedPolicies().catch(console.error);