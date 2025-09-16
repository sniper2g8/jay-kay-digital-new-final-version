// Debug the specific RLS issue with user role fetching
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function debugRLSIssue() {
  let client;
  try {
    client = await pool.connect();
    
    console.log('🔍 Debugging RLS issue with user role fetching...');
    console.log('================================================');
    
    // Check if there are any users in appUsers
    const usersCheck = await client.query(`
      SELECT id, email, primary_role 
      FROM public."appUsers" 
      LIMIT 5
    `);
    
    console.log('\n👥 Sample users in appUsers:');
    usersCheck.rows.forEach(user => {
      console.log(`  ${user.email} (${user.primary_role}) - ID: ${user.id.substring(0, 8)}...`);
    });
    
    // Check current RLS policies on appUsers
    console.log('\n📋 Current appUsers policies:');
    const policiesCheck = await client.query(`
      SELECT 
        policyname,
        cmd as operation,
        permissive,
        roles,
        qual as condition
      FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'appUsers'
      ORDER BY policyname
    `);
    
    policiesCheck.rows.forEach(policy => {
      console.log(`  Policy: ${policy.policyname}`);
      console.log(`    Operation: ${policy.operation}`);
      console.log(`    Condition: ${policy.condition || 'none'}`);
      console.log('');
    });
    
    // The issue: We need to modify the SELECT policy to allow authenticated users
    // to read their own data using auth.uid() directly
    console.log('🔧 Fixing appUsers SELECT policy...');
    
    // Drop the existing restrictive policy
    try {
      await client.query('DROP POLICY IF EXISTS "auth_users_select_appUsers" ON public."appUsers"');
      console.log('✅ Dropped old SELECT policy');
    } catch (error) {
      console.log('⚠️  No old policy to drop');
    }
    
    // Create a new policy that allows users to read their own data
    await client.query(`
      CREATE POLICY "users_can_read_own_data" ON public."appUsers"
      FOR SELECT 
      TO authenticated
      USING (id = auth.uid())
    `);
    console.log('✅ Created new "users_can_read_own_data" policy');
    
    // Also ensure admins can still read all data
    try {
      await client.query('DROP POLICY IF EXISTS "admin_full_access_appUsers" ON public."appUsers"');
      console.log('✅ Dropped old admin policy');
    } catch (error) {
      console.log('⚠️  No old admin policy to drop');
    }
    
    await client.query(`
      CREATE POLICY "admins_can_read_all_users" ON public."appUsers"
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public."appUsers" u2
          WHERE u2.id = auth.uid() 
          AND u2.primary_role IN ('admin', 'super_admin')
        )
      )
    `);
    console.log('✅ Created new admin read policy');
    
    // Create update policy for users to modify their own data
    await client.query(`
      CREATE POLICY "users_can_update_own_data" ON public."appUsers"
      FOR UPDATE
      TO authenticated
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid())
    `);
    console.log('✅ Created user update policy');
    
    // Admin full access policy
    await client.query(`
      CREATE POLICY "admins_full_access" ON public."appUsers"
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public."appUsers" u2
          WHERE u2.id = auth.uid() 
          AND u2.primary_role IN ('admin', 'super_admin')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public."appUsers" u2
          WHERE u2.id = auth.uid() 
          AND u2.primary_role IN ('admin', 'super_admin')
        )
      )
    `);
    console.log('✅ Created admin full access policy');
    
    // Verify the new policies
    console.log('\n✅ New appUsers policies:');
    const newPoliciesCheck = await client.query(`
      SELECT 
        policyname,
        cmd as operation
      FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'appUsers'
      ORDER BY policyname
    `);
    
    newPoliciesCheck.rows.forEach(policy => {
      console.log(`  - ${policy.policyname} (${policy.operation})`);
    });
    
    console.log('\n🎯 RLS fix completed!');
    console.log('✅ Users can now read their own data using auth.uid()');
    console.log('✅ Admins can still access all user data');
    console.log('✅ The fetchUserRole function should work now');
    
  } catch (err) {
    console.error('💥 Error:', err.message);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

debugRLSIssue();