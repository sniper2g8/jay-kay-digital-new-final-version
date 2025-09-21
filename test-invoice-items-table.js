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

async function testInvoiceItemsTable() {
  console.log('=== Testing Invoice Items Table Access ===');
  
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
    
    // Test access to invoice_items table
    console.log('3. Testing invoice_items table access...');
    const itemsResult = await client.query('SELECT COUNT(*) FROM invoice_items');
    console.log('✅ Invoice items table access successful');
    console.log('   Invoice items count:', itemsResult.rows[0].count);
    
    // Test a specific query with a test ID
    console.log('4. Testing query with specific invoice ID...');
    const testResult = await client.query('SELECT * FROM invoice_items WHERE invoice_id = $1 LIMIT 1', ['test-id']);
    console.log('✅ Query with specific ID successful');
    console.log('   Found rows:', testResult.rowCount);
    
    await client.end();
    console.log('\n=== Invoice Items Table Test Complete ===');
    
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

testInvoiceItemsTable().catch(console.error);