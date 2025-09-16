// Test customers query directly to see the exact error
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testCustomersQuery() {
  let client;
  try {
    client = await pool.connect();
    
    console.log('🧪 Testing customers query directly...');
    console.log('=====================================');
    
    // Get a sample user ID to test with
    const userResult = await client.query(`
      SELECT id, email, primary_role 
      FROM public."appUsers" 
      WHERE primary_role IN ('admin', 'super_admin')
      LIMIT 1
    `);
    
    if (userResult.rows.length === 0) {
      console.log('❌ No admin users found, using a regular user');
      const anyUserResult = await client.query(`
        SELECT id, email, primary_role 
        FROM public."appUsers" 
        LIMIT 1
      `);
      
      if (anyUserResult.rows.length === 0) {
        console.log('❌ No users found at all!');
        return;
      }
      
      console.log(`Using user: ${anyUserResult.rows[0].email} (${anyUserResult.rows[0].primary_role})`);
    } else {
      console.log(`Using admin user: ${userResult.rows[0].email} (${userResult.rows[0].primary_role})`);
    }
    
    // Try the customers query that the app would make
    console.log('\n🔍 Testing customers SELECT query...');
    
    try {
      const customersResult = await client.query(`
        SELECT * FROM public.customers 
        ORDER BY created_at DESC
      `);
      
      console.log(`✅ Query successful! Found ${customersResult.rows.length} customers`);
      
      if (customersResult.rows.length > 0) {
        console.log('\n📋 Sample customer data:');
        console.log(JSON.stringify(customersResult.rows[0], null, 2));
      }
      
    } catch (queryError) {
      console.error('❌ Customers query failed:', {
        message: queryError.message,
        code: queryError.code,
        detail: queryError.detail,
        hint: queryError.hint
      });
      
      // The issue might be that we're querying without auth context
      // Let's check what happens with a simulated auth context
      console.log('\n🔧 The issue might be missing auth context in direct query');
      console.log('   This would work in the browser with Supabase auth');
    }
    
    // Let's also check what policies are actually active
    console.log('\n📋 Active RLS policies on customers:');
    const policiesResult = await client.query(`
      SELECT policyname, cmd, permissive, roles, qual 
      FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'customers'
    `);
    
    policiesResult.rows.forEach(policy => {
      console.log(`- ${policy.policyname} (${policy.cmd}): ${policy.qual || 'no condition'}`);
    });
    
    // Check if RLS is actually enabled
    const rlsStatus = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = 'customers'
    `);
    
    console.log('\n🔒 RLS Status:', rlsStatus.rows[0]);
    
  } catch (err) {
    console.error('💥 Error:', err.message);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

testCustomersQuery();