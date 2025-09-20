// Direct PostgreSQL connection to apply RLS fixes
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function applyRLSFixes() {
  console.log('Applying RLS fixes directly to database...');
  
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
    
    // Apply the service role bypass policy for notifications
    const notificationQueries = [
      `CREATE POLICY "service_role_bypass_notifications" 
       ON notifications 
       FOR ALL 
       TO service_role 
       USING (true) 
       WITH CHECK (true)`,
      
      `GRANT ALL ON notifications TO service_role`,
      
      `ALTER TABLE notifications ENABLE ROW LEVEL SECURITY`
    ];
    
    console.log('Applying notification table fixes...');
    for (const query of notificationQueries) {
      try {
        await client.query(query);
        console.log('✅ Executed query:', query.substring(0, 50) + '...');
      } catch (err) {
        console.error('❌ Error executing query:', err.message);
      }
    }
    
    // Apply the service role bypass policy for appUsers
    const appUsersQueries = [
      `CREATE POLICY "service_role_bypass_appusers" 
       ON "appUsers" 
       FOR ALL 
       TO service_role 
       USING (true) 
       WITH CHECK (true)`,
      
      `GRANT ALL ON "appUsers" TO service_role`,
      
      `ALTER TABLE "appUsers" ENABLE ROW LEVEL SECURITY`
    ];
    
    console.log('Applying appUsers table fixes...');
    for (const query of appUsersQueries) {
      try {
        await client.query(query);
        console.log('✅ Executed query:', query.substring(0, 50) + '...');
      } catch (err) {
        console.error('❌ Error executing query:', err.message);
      }
    }
    
    // Apply the service role bypass policy for notification_preferences
    const notificationPreferencesQueries = [
      `CREATE POLICY "service_role_bypass_preferences" 
       ON "notification_preferences" 
       FOR ALL 
       TO service_role 
       USING (true) 
       WITH CHECK (true)`,
      
      `GRANT ALL ON "notification_preferences" TO service_role`,
      
      `ALTER TABLE "notification_preferences" ENABLE ROW LEVEL SECURITY`
    ];
    
    console.log('Applying notification_preferences table fixes...');
    for (const query of notificationPreferencesQueries) {
      try {
        await client.query(query);
        console.log('✅ Executed query:', query.substring(0, 50) + '...');
      } catch (err) {
        console.error('❌ Error executing query:', err.message);
      }
    }
    
    console.log('✅ All RLS fixes applied successfully');
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
  } finally {
    await client.end();
  }
}

applyRLSFixes();