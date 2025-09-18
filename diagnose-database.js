const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

console.log('Environment variables loaded:');
console.log('HOST:', process.env.DATABASE_HOST);
console.log('PORT:', process.env.DATABASE_PORT);
console.log('USER:', process.env.DATABASE_USER);
console.log('PASSWORD:', process.env.DATABASE_PASSWORD ? '[REDACTED]' : 'NOT SET');

const client = new Client({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function diagnoseDatabase() {
  try {
    await client.connect();
    console.log('✅ Connected to database successfully');
    
    // Check if notifications table exists
    console.log('\n=== Checking notifications table ===');
    try {
      const notificationCheck = await client.query(`
        SELECT COUNT(*) as count FROM notifications;
      `);
      console.log(`✅ Notifications table exists with ${notificationCheck.rows[0].count} records`);
    } catch (error) {
      console.log('❌ Notifications table issue:', error.message);
    }
    
    // Check if jobs table exists  
    console.log('\n=== Checking jobs table ===');
    try {
      const jobsCheck = await client.query(`
        SELECT COUNT(*) as count FROM jobs;
      `);
      console.log(`✅ Jobs table exists with ${jobsCheck.rows[0].count} records`);
    } catch (error) {
      console.log('❌ Jobs table issue:', error.message);
    }
    
    // Check if counters table exists and get_next_counter function
    console.log('\n=== Checking counters and function ===');
    try {
      const countersCheck = await client.query(`
        SELECT * FROM counters WHERE counter_id = 'job';
      `);
      console.log('✅ Job counter:', countersCheck.rows[0]);
      
      // Test the get_next_counter function
      const functionTest = await client.query(`
        SELECT get_next_counter('job') as next_number;
      `);
      console.log('✅ get_next_counter function works, next number:', functionTest.rows[0].next_number);
    } catch (error) {
      console.log('❌ Counter/function issue:', error.message);
    }
    
    // Check customers table
    console.log('\n=== Checking customers table ===');
    try {
      const customersCheck = await client.query(`
        SELECT COUNT(*) as count FROM customers;
      `);
      console.log(`✅ Customers table exists with ${customersCheck.rows[0].count} records`);
    } catch (error) {
      console.log('❌ Customers table issue:', error.message);
    }
    
    // Check services table
    console.log('\n=== Checking services table ===');
    try {
      const servicesCheck = await client.query(`
        SELECT COUNT(*) as count FROM services;
      `);
      console.log(`✅ Services table exists with ${servicesCheck.rows[0].count} records`);
    } catch (error) {
      console.log('❌ Services table issue:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await client.end();
  }
}

diagnoseDatabase();