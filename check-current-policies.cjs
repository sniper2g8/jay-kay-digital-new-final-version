// Check current policies on appUsers table using direct SQL
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function checkCurrentPolicies() {
  console.log('Checking current policies on appUsers table...');
  
  // Create a direct PostgreSQL client
  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Check current policies
    const query = `
      SELECT policyname, tablename, roles, cmd, qual, with_check 
      FROM pg_policies 
      WHERE tablename = 'appUsers'
      ORDER BY policyname;
    `;
    
    const result = await client.query(query);
    console.log('\nCurrent policies on appUsers table:');
    console.log('-----------------------------------');
    
    if (result.rows.length === 0) {
      console.log('No policies found');
    } else {
      result.rows.forEach(row => {
        console.log(`Policy: ${row.policyname}`);
        console.log(`  Table: ${row.tablename}`);
        console.log(`  Roles: ${row.roles}`);
        console.log(`  Command: ${row.cmd}`);
        console.log(`  Qual: ${row.qual || 'NULL'}`);
        console.log(`  With Check: ${row.with_check || 'NULL'}`);
        console.log('');
      });
    }
    
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
  } finally {
    await client.end();
  }
}

checkCurrentPolicies();