const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function disableRLSForDevelopment() {
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    console.log('\n🔓 Temporarily disabling RLS for development...');
    
    const tables = ['notifications', 'jobs', 'customers', 'services', 'counters', 'file_attachments'];
    
    for (const table of tables) {
      try {
        await client.query(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`);
        console.log(`✅ RLS disabled on ${table}`);
      } catch (error) {
        if (error.message.includes('does not exist')) {
          console.log(`ℹ️ Table ${table} does not exist, skipping`);
        } else {
          console.log(`⚠️ Error disabling RLS on ${table}:`, error.message);
        }
      }
    }
    
    // Test access
    console.log('\n🧪 Testing access after disabling RLS...');
    const testNotifications = await client.query('SELECT COUNT(*) as count FROM notifications;');
    console.log('✅ Notifications accessible:', testNotifications.rows[0].count, 'records');
    
    const testJobs = await client.query('SELECT COUNT(*) as count FROM jobs;');
    console.log('✅ Jobs accessible:', testJobs.rows[0].count, 'records');
    
    const testCustomers = await client.query('SELECT COUNT(*) as count FROM customers;');
    console.log('✅ Customers accessible:', testCustomers.rows[0].count, 'records');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

disableRLSForDevelopment();