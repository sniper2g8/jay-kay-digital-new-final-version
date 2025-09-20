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

async function checkAppUsersStructure() {
  console.log('=== Checking appUsers table structure ===');
  
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
    
    // Check appUsers table structure
    console.log('1. Checking appUsers table structure...');
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'appUsers'
      ORDER BY ordinal_position
    `);
    
    if (columnsResult.rows.length > 0) {
      console.log('   Columns in appUsers table:');
      columnsResult.rows.forEach(row => {
        console.log(`   - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    } else {
      console.log('   Could not retrieve columns for appUsers table');
    }
    
    // Check sample data (using quoted table name)
    console.log('2. Checking sample data from appUsers...');
    const sampleResult = await client.query(`
      SELECT *
      FROM "appUsers"
      LIMIT 3
    `);
    
    if (sampleResult.rows.length > 0) {
      console.log(`   Found ${sampleResult.rows.length} sample records:`);
      sampleResult.rows.forEach((row, index) => {
        console.log(`   Record ${index + 1}:`);
        Object.keys(row).forEach(key => {
          console.log(`     ${key}: ${row[key]}`);
        });
        console.log('');
      });
    } else {
      console.log('   No records found in appUsers table');
    }
    
    // Check roles table structure
    console.log('3. Checking roles table structure...');
    const rolesColumnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'roles'
      ORDER BY ordinal_position
    `);
    
    if (rolesColumnsResult.rows.length > 0) {
      console.log('   Columns in roles table:');
      rolesColumnsResult.rows.forEach(row => {
        console.log(`   - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    }
    
    // Check sample roles
    console.log('4. Checking sample roles...');
    const rolesSampleResult = await client.query(`
      SELECT *
      FROM roles
      LIMIT 5
    `);
    
    if (rolesSampleResult.rows.length > 0) {
      console.log(`   Found ${rolesSampleResult.rows.length} roles:`);
      rolesSampleResult.rows.forEach(row => {
        console.log(`   - ${row.name} (${row.id})`);
      });
    }
    
    await client.end();
    console.log('\n=== Structure Check Complete ===');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

checkAppUsersStructure().catch(console.error);