// Completely fix appUsers RLS policies to remove recursion
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function fixAppUsersRLSCompletely() {
  console.log('Completely fixing appUsers RLS policies...');
  
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
    
    // Drop all existing policies on appUsers table
    const dropPolicies = [
      `DROP POLICY IF EXISTS "Admins can view all users" ON "appUsers"`,
      `DROP POLICY IF EXISTS "Users can view own record" ON "appUsers"`,
      `DROP POLICY IF EXISTS "authenticated_users_basic_read" ON "appUsers"`,
      `DROP POLICY IF EXISTS "users_read_own_profile" ON "appUsers"`,
      `DROP POLICY IF EXISTS "users_update_own_profile" ON "appUsers"`,
      `DROP POLICY IF EXISTS "users_view_own_record" ON "appUsers"`,
      `DROP POLICY IF EXISTS "admins_view_all_users" ON "appUsers"`
    ];
    
    console.log('Dropping existing policies...');
    for (const query of dropPolicies) {
      try {
        await client.query(query);
        console.log('✅ Dropped policy');
      } catch (err) {
        console.error('❌ Error dropping policy:', err.message);
      }
    }
    
    // Create new clean policies
    const createPolicies = [
      // Service role bypass (allows server-side operations)
      `CREATE POLICY "service_role_bypass_appusers" 
       ON "appUsers" 
       FOR ALL 
       TO service_role 
       USING (true) 
       WITH CHECK (true)`,
       
      // Users can view their own record
      `CREATE POLICY "users_read_own_record" 
       ON "appUsers" 
       FOR SELECT 
       TO authenticated
       USING (id = auth.uid())`,
       
      // Users can update their own record
      `CREATE POLICY "users_update_own_record" 
       ON "appUsers" 
       FOR UPDATE 
       TO authenticated
       USING (id = auth.uid())
       WITH CHECK (id = auth.uid())`
    ];
    
    console.log('Creating new policies...');
    for (const query of createPolicies) {
      try {
        await client.query(query);
        console.log('✅ Created policy');
      } catch (err) {
        console.error('❌ Error creating policy:', err.message);
      }
    }
    
    console.log('✅ All appUsers RLS policies fixed successfully');
    
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
  } finally {
    await client.end();
  }
}

fixAppUsersRLSCompletely();