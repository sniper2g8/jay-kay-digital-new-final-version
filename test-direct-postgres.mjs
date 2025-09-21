import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Supabase PostgreSQL connection details
// Format: postgresql://[user[:password]@][host][:port][/database]
const SUPABASE_PROJECT_ID = 'pnoxqzlxfuvjvufdjuqh';
const DB_USER = 'postgres.${SUPABASE_PROJECT_ID}';
const DB_HOST = 'aws-0-us-west-1.pooler.supabase.com';
const DB_PORT = '6543';
const DB_NAME = 'postgres';
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || '';

if (!DB_PASSWORD) {
  console.error('❌ Missing database password. Please set SUPABASE_DB_PASSWORD in your .env.local file');
  process.exit(1);
}

const connectionString = `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

console.log('🔗 Attempting to connect to PostgreSQL...');
console.log('Host:', DB_HOST);
console.log('User:', DB_USER);
console.log('Database:', DB_NAME);

const { Client } = pg;

const client = new Client({
  connectionString: connectionString,
});

async function testConnection() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database!');
    
    // Test queries
    console.log('\\n📋 Testing table access...');
    
    // Test appUsers access
    try {
      const appUsersResult = await client.query('SELECT COUNT(*) FROM appUsers');
      console.log(`✅ appUsers table accessible: ${appUsersResult.rows[0].count} records`);
    } catch (error) {
      console.log(`❌ appUsers table access failed: ${error.message}`);
    }
    
    // Test customers access
    try {
      const customersResult = await client.query('SELECT COUNT(*) FROM customers');
      console.log(`✅ customers table accessible: ${customersResult.rows[0].count} records`);
    } catch (error) {
      console.log(`❌ customers table access failed: ${error.message}`);
    }
    
    // Test statement periods access
    try {
      const statementResult = await client.query('SELECT COUNT(*) FROM customer_statement_periods');
      console.log(`✅ customer_statement_periods table accessible: ${statementResult.rows[0].count} records`);
    } catch (error) {
      console.log(`❌ customer_statement_periods table access failed: ${error.message}`);
    }
    
    await client.end();
    console.log('\\n🔌 Disconnected from database');
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    if (error.code === 'ENOTFOUND') {
      console.log('💡 DNS resolution failed. This might be due to network issues or incorrect host.');
    }
  }
}

testConnection();