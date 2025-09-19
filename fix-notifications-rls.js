require('dotenv').config({ path: '.env.local' });
import { Client } from 'pg';;

const dbConfig = {
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: { rejectUnauthorized: false }
};

async function fixNotificationPermissions() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Check current RLS status
    console.log('\n=== Checking current RLS status ===');
    const rlsCheck = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('notifications', 'jobs', 'customers');
    `);
    
    console.log('Current RLS status:');
    rlsCheck.rows.forEach(row => {
      console.log(`- ${row.tablename}: ${row.rowsecurity ? 'ENABLED' : 'DISABLED'}`);
    });

    // Disable RLS on notifications table temporarily for development
    console.log('\n=== Disabling RLS on notifications table ===');
    await client.query('ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;');
    console.log('✅ Disabled RLS on notifications table');

    // Verify the change
    const verifyCheck = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = 'notifications';
    `);
    
    console.log('Updated status:');
    verifyCheck.rows.forEach(row => {
      console.log(`- ${row.tablename}: ${row.rowsecurity ? 'ENABLED' : 'DISABLED'}`);
    });

  } catch (error) {
    console.error('Database operation failed:', error);
  } finally {
    await client.end();
  }
}

fixNotificationPermissions().catch(console.error);