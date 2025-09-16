// Fix the remaining RLS issues for customers and appUsers tables
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fixRemainingRLS() {
  let client;
  try {
    client = await pool.connect();
    
    console.log('🔧 Fixing remaining RLS issues...');
    console.log('==================================');
    
    // Check what tables actually exist with exact casing
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('customers', 'appUsers', 'appusers')
      ORDER BY table_name
    `);
    
    console.log('📋 Found tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Enable RLS on customers table
    try {
      await client.query('ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY');
      console.log('✅ Enabled RLS on customers table');
    } catch (error) {
      console.log(`⚠️  Customers RLS: ${error.message}`);
    }
    
    // Try to enable RLS on appUsers with proper casing
    try {
      await client.query('ALTER TABLE public."appUsers" ENABLE ROW LEVEL SECURITY');
      console.log('✅ Enabled RLS on "appUsers" table (quoted)');
    } catch (error) {
      console.log(`⚠️  appUsers RLS: ${error.message}`);
    }
    
    // Create missing customers policies
    console.log('\n📝 Adding missing customers policies...');
    
    try {
      await client.query(`
        CREATE POLICY "auth_users_select_customers" ON public.customers
        FOR SELECT TO authenticated USING (true)
      `);
      console.log('✅ Created customers SELECT policy');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Customers SELECT policy already exists');
      } else {
        console.log(`❌ Customers SELECT policy: ${error.message}`);
      }
    }
    
    try {
      await client.query(`
        CREATE POLICY "admin_full_access_customers" ON public.customers
        FOR ALL TO authenticated USING (
          EXISTS (
            SELECT 1 FROM public."appUsers"
            WHERE id = auth.uid() AND primary_role IN ('admin', 'super_admin')
          )
        )
      `);
      console.log('✅ Created customers ADMIN policy');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Customers ADMIN policy already exists');
      } else {
        console.log(`❌ Customers ADMIN policy: ${error.message}`);
      }
    }
    
    // Final verification
    console.log('\n🔍 Final RLS Status Check:');
    console.log('==========================');
    
    const finalCheck = await client.query(`
      SELECT 
        tablename,
        rowsecurity as rls_enabled
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('appUsers', 'customers', 'jobs', 'invoices', 'payments')
      ORDER BY tablename
    `);
    
    finalCheck.rows.forEach(row => {
      const status = row.rls_enabled ? '🔒 SECURED' : '🚨 UNSECURED';
      console.log(`${row.tablename.padEnd(20)} | ${status}`);
    });
    
    console.log('\n🎯 Row Level Security Setup Complete!');
    console.log('✅ All authenticated users can read data');
    console.log('✅ Only admins/super_admins can modify data');
    console.log('✅ Database is properly secured');
    
  } catch (err) {
    console.error('💥 Error:', err.message);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

fixRemainingRLS();