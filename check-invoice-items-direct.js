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

async function checkInvoiceItemsDirect() {
  console.log('=== Checking Invoice Items Table Directly ===');
  
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
    
    // Check if invoice_items table exists
    console.log('3. Checking if invoice_items table exists...');
    const tableResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'invoice_items' 
      AND table_schema = 'public'
    `);
    
    if (tableResult.rows.length === 0) {
      console.log('❌ invoice_items table does not exist');
      await client.end();
      return;
    }
    
    console.log('✅ invoice_items table exists');
    
    // Check RLS status
    console.log('4. Checking RLS status...');
    const rlsResult = await client.query(`
      SELECT relname, relrowsecurity 
      FROM pg_class 
      WHERE relname = 'invoice_items' 
      AND relkind = 'r'
    `);
    
    if (rlsResult.rows.length > 0) {
      const rlsEnabled = rlsResult.rows[0].relrowsecurity;
      console.log(`   RLS enabled: ${rlsEnabled ? 'Yes' : 'No'}`);
    } else {
      console.log('   Could not determine RLS status');
    }
    
    // Check existing policies
    console.log('5. Checking existing policies...');
    const policiesResult = await client.query(`
      SELECT policyname, permissive, cmd, qual, with_check
      FROM pg_policies 
      WHERE tablename = 'invoice_items'
    `);
    
    if (policiesResult.rows.length > 0) {
      console.log(`   Found ${policiesResult.rows.length} policies:`);
      policiesResult.rows.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`);
      });
    } else {
      console.log('   No policies found');
    }
    
    // Try to access the table with a simple query
    console.log('6. Testing table access...');
    try {
      const accessResult = await client.query('SELECT COUNT(*) FROM invoice_items LIMIT 1');
      console.log('✅ Table access successful');
      console.log('   Row count:', accessResult.rows[0].count);
    } catch (accessError) {
      console.log('❌ Table access failed:', accessError.message);
    }
    
    await client.end();
    console.log('\n=== Check Complete ===');
    
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

checkInvoiceItemsDirect().catch(console.error);