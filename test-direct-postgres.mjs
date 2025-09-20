/**
 * Test direct PostgreSQL connection with proper error handling
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { Client } from 'pg';

async function testDirectPostgres() {
  console.log('Testing direct PostgreSQL connection...\n');
  
  // Extract connection details from the Supabase URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  try {
    // Parse the URL to get connection details
    const url = new URL(supabaseUrl);
    const host = url.hostname;
    const port = url.port || 5432;
    
    // Extract database name from the path
    const database = url.pathname.substring(1) || 'postgres';
    
    // The service role key is used as the password
    const password = serviceKey;
    const user = 'postgres.' + host.split('.')[0]; // Extract project ID from hostname
    
    console.log(`Connection details:`);
    console.log(`  Host: ${host}`);
    console.log(`  Port: ${port}`);
    console.log(`  Database: ${database}`);
    console.log(`  User: ${user}`);
    console.log(`  Password length: ${password?.length || 0}`);
    
    const client = new Client({
      host,
      port,
      database,
      user,
      password,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    console.log('\nConnecting to PostgreSQL...');
    await client.connect();
    console.log('  ✅ Connected successfully');
    
    console.log('\nTesting query on notifications table...');
    const result = await client.query('SELECT COUNT(*) FROM notifications LIMIT 1');
    console.log('  ✅ Query successful');
    console.log(`  Result: ${result.rows[0].count}`);
    
    await client.end();
    console.log('\n🎉 Direct PostgreSQL connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
  }
}

testDirectPostgres().catch(console.error);