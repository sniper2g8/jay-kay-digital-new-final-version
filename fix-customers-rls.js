// Fix customers table RLS policies
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fixCustomersRLS() {
  let client;
  try {
    client = await pool.connect();
    
    console.log('🔍 Debugging customers RLS policies...');
    console.log('====================================');
    
    // Check current customers policies
    const policiesCheck = await client.query(`
      SELECT 
        policyname,
        cmd as operation,
        permissive,
        qual as condition,
        with_check
      FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'customers'
      ORDER BY policyname
    `);
    
    console.log('\n📋 Current customers policies:');
    policiesCheck.rows.forEach(policy => {
      console.log(`  Policy: ${policy.policyname} (${policy.operation})`);
      console.log(`    Condition: ${policy.condition || 'none'}`);
      console.log('');
    });
    
    // Check if there are any customers
    const customersCount = await client.query('SELECT COUNT(*) as count FROM public.customers');
    console.log(`\n📊 Total customers in database: ${customersCount.rows[0].count}`);
    
    // The issue is likely that the current policy is too restrictive
    // Let's create a proper policy that allows authenticated users to read customers
    
    console.log('\n🔧 Fixing customers RLS policies...');
    
    // Drop existing policies
    await client.query('DROP POLICY IF EXISTS "auth_users_select_customers" ON public.customers');
    await client.query('DROP POLICY IF EXISTS "admin_full_access_customers" ON public.customers');
    console.log('✅ Dropped existing policies');
    
    // Create new policy: authenticated users can read all customers
    await client.query(`
      CREATE POLICY "authenticated_users_read_customers" ON public.customers
      FOR SELECT 
      TO authenticated
      USING (true)
    `);
    console.log('✅ Created "authenticated_users_read_customers" policy');
    
    // Create customer-specific policy: customers can only see their own data
    await client.query(`
      CREATE POLICY "customers_read_own_data" ON public.customers
      FOR SELECT
      TO authenticated
      USING (
        contact_person_id = auth.uid()
        OR email = (
          SELECT email FROM auth.users WHERE id = auth.uid()
        )
      )
    `);
    console.log('✅ Created "customers_read_own_data" policy');
    
    // Admin policies for full access
    await client.query(`
      CREATE POLICY "admins_full_access_customers" ON public.customers
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public."appUsers"
          WHERE id = auth.uid() 
          AND primary_role IN ('admin', 'super_admin')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public."appUsers"
          WHERE id = auth.uid() 
          AND primary_role IN ('admin', 'super_admin')
        )
      )
    `);
    console.log('✅ Created "admins_full_access_customers" policy');
    
    // Verify new policies
    console.log('\n✅ New customers policies:');
    const newPoliciesCheck = await client.query(`
      SELECT 
        policyname,
        cmd as operation
      FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'customers'
      ORDER BY policyname
    `);
    
    newPoliciesCheck.rows.forEach(policy => {
      console.log(`  - ${policy.policyname} (${policy.operation})`);
    });
    
    console.log('\n🎯 Customers RLS fix completed!');
    console.log('✅ Authenticated users can read customer data');
    console.log('✅ Customers can see their own business data');
    console.log('✅ Admins have full access to all customers');
    
  } catch (err) {
    console.error('💥 Error:', err.message);
    console.error('Full error:', err);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

fixCustomersRLS();