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

async function checkAppUsersTable() {
  console.log('=== Checking for appUsers table ===');
  
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
    
    // Check for appUsers table
    console.log('1. Checking for appUsers table...');
    const appUsersResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name ILIKE '%user%'
    `);
    
    if (appUsersResult.rows.length > 0) {
      console.log('   Found user-related tables:');
      appUsersResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('   No user-related tables found');
    }
    
    // List all tables
    console.log('2. Listing all tables...');
    const allTablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('   All tables:');
    allTablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Check if there's a roles or permissions table
    console.log('3. Checking for roles/permissions tables...');
    const rolesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name ILIKE '%role%' OR table_name ILIKE '%permission%')
    `);
    
    if (rolesResult.rows.length > 0) {
      console.log('   Found roles/permissions tables:');
      rolesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('   No roles/permissions tables found');
    }
    
    await client.end();
    console.log('\n=== Table Check Complete ===');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

checkAppUsersTable().catch(console.error);