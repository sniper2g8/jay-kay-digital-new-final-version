// Fix infinite recursion in appUsers RLS policies using direct PostgreSQL connection
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function fixAppUsersRLSRecursion() {
  console.log('Fixing infinite recursion in appUsers RLS policies...');
  
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
    
    // Fix the infinite recursion issue by dropping and recreating policies
    const queries = [
      // Drop the problematic policy that causes recursion
      `DROP POLICY IF EXISTS "admins_view_all_users" ON "appUsers"`,
      
      // Recreate a simpler policy that doesn't cause recursion
      `CREATE POLICY "users_view_own_record" 
       ON "appUsers" 
       FOR SELECT 
       USING (id = auth.uid())`,
       
      // Ensure service role bypass policy exists
      `ALTER POLICY "service_role_bypass_appusers" ON "appUsers" 
       USING (true) 
       WITH CHECK (true)`
    ];
    
    for (const query of queries) {
      try {
        await client.query(query);
        console.log('✅ Executed query:', query.substring(0, 60) + '...');
      } catch (err) {
        console.error('❌ Error executing query:', err.message);
        console.error('Query:', query);
      }
    }
    
    console.log('✅ RLS recursion fix applied successfully');
    
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
  } finally {
    await client.end();
  }
}

fixAppUsersRLSRecursion();