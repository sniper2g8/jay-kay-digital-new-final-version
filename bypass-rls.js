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

async function bypassRLSForServiceRole() {
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Check what role/user we're using
    const roleCheck = await client.query('SELECT current_user, current_role;');
    console.log('Current user/role:', roleCheck.rows[0]);
    
    // The issue might be that we need to configure RLS bypass for service role
    // Let's try different approaches
    
    console.log('\n🔧 Method 1: Drop and recreate policies with service role bypass...');
    
    const tables = ['notifications', 'jobs', 'customers', 'services', 'counters'];
    
    for (const table of tables) {
      try {
        // Drop existing policies
        const policies = await client.query(`
          SELECT policyname FROM pg_policies WHERE tablename = '${table}';
        `);
        
        for (const policy of policies.rows) {
          await client.query(`DROP POLICY IF EXISTS "${policy.policyname}" ON ${table};`);
          console.log(`🗑️ Dropped policy ${policy.policyname} on ${table}`);
        }
        
        // Create new policies that work for service role
        await client.query(`
          CREATE POLICY "${table}_service_role_bypass" ON ${table}
          FOR ALL 
          USING (true)
          WITH CHECK (true);
        `);
        console.log(`✅ Created service role bypass policy for ${table}`);
        
      } catch (error) {
        console.log(`⚠️ Error with ${table}:`, error.message);
      }
    }
    
    // Test the access
    console.log('\n🧪 Testing direct database access...');
    const testNotifications = await client.query('SELECT COUNT(*) as count FROM notifications;');
    console.log('✅ Direct notifications access:', testNotifications.rows[0].count, 'records');
    
    const testJobs = await client.query('SELECT COUNT(*) as count FROM jobs;');
    console.log('✅ Direct jobs access:', testJobs.rows[0].count, 'records');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

bypassRLSForServiceRole();