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

async function fixRLSPolicies() {
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    console.log('\n🔧 Checking and fixing RLS policies...');
    
    // Check current RLS status
    const rlsStatus = await client.query(`
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE tablename IN ('notifications', 'jobs', 'customers', 'services', 'counters')
      AND schemaname = 'public';
    `);
    
    console.log('\n📋 Current RLS status:');
    rlsStatus.rows.forEach(row => {
      console.log(`${row.tablename}: RLS ${row.rowsecurity ? 'ENABLED' : 'DISABLED'}`);
    });
    
    // Create comprehensive RLS policies for all necessary tables
    const policies = [
      // Notifications policies
      `
      CREATE POLICY "notifications_authenticated_users" ON notifications
      FOR ALL USING (true);
      `,
      
      // Jobs policies  
      `
      CREATE POLICY "jobs_authenticated_users" ON jobs
      FOR ALL USING (true);
      `,
      
      // Customers policies
      `
      CREATE POLICY "customers_authenticated_users" ON customers
      FOR ALL USING (true);
      `,
      
      // Services policies
      `
      CREATE POLICY "services_read_all" ON services
      FOR SELECT USING (true);
      `,
      
      // Counters policies
      `
      CREATE POLICY "counters_authenticated_users" ON counters
      FOR ALL USING (true);
      `,
      
      // File attachments policies (if exists)
      `
      CREATE POLICY "file_attachments_authenticated_users" ON file_attachments
      FOR ALL USING (true);
      `
    ];
    
    console.log('\n🛡️ Creating/updating RLS policies...');
    
    for (const policy of policies) {
      try {
        await client.query(policy);
        console.log('✅ Policy applied successfully');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('ℹ️ Policy already exists, skipping');
        } else {
          console.log('⚠️ Policy error:', error.message);
        }
      }
    }
    
    // Also ensure RLS is enabled on all tables
    const tables = ['notifications', 'jobs', 'customers', 'services', 'counters'];
    
    console.log('\n🔒 Ensuring RLS is enabled...');
    for (const table of tables) {
      try {
        await client.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
        console.log(`✅ RLS enabled on ${table}`);
      } catch (error) {
        if (error.message.includes('already enabled')) {
          console.log(`ℹ️ RLS already enabled on ${table}`);
        } else {
          console.log(`⚠️ RLS error on ${table}:`, error.message);
        }
      }
    }
    
    // Test the fix
    console.log('\n🧪 Testing access after policy update...');
    const testQuery = await client.query('SELECT COUNT(*) as count FROM notifications;');
    console.log('✅ Notifications accessible:', testQuery.rows[0].count, 'records');
    
  } catch (error) {
    console.error('❌ Error fixing RLS:', error.message);
  } finally {
    await client.end();
  }
}

fixRLSPolicies();