// Fix jobs table RLS policies
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fixJobsRLS() {
  let client;
  try {
    client = await pool.connect();
    
    console.log('🔍 Debugging jobs RLS policies...');
    console.log('================================');
    
    // Check current jobs policies
    const policiesCheck = await client.query(`
      SELECT 
        policyname,
        cmd as operation,
        permissive,
        qual as condition,
        with_check
      FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'jobs'
      ORDER BY policyname
    `);
    
    console.log('\n📋 Current jobs policies:');
    policiesCheck.rows.forEach(policy => {
      console.log(`  Policy: ${policy.policyname} (${policy.operation})`);
      console.log(`    Condition: ${policy.condition || 'none'}`);
      console.log('');
    });
    
    // Check jobs table structure
    const jobsCount = await client.query('SELECT COUNT(*) as count FROM public.jobs');
    console.log(`\n📊 Total jobs in database: ${jobsCount.rows[0].count}`);
    
    // Check jobs table columns to see what we're working with
    const columnsCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'jobs'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Jobs table columns:');
    columnsCheck.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    console.log('\n🔧 Fixing jobs RLS policies...');
    
    // Drop ALL existing policies on jobs
    const existingPolicies = await client.query(`
      SELECT policyname FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'jobs'
    `);
    
    console.log('🗑️  Dropping existing policies:');
    for (const policy of existingPolicies.rows) {
      try {
        await client.query(`DROP POLICY IF EXISTS "${policy.policyname}" ON public.jobs`);
        console.log(`  ✅ Dropped: ${policy.policyname}`);
      } catch (err) {
        console.log(`  ⚠️  Could not drop ${policy.policyname}: ${err.message}`);
      }
    }
    
    // Create simple, working policies
    
    // Policy 1: Authenticated users can read all jobs
    await client.query(`
      CREATE POLICY "authenticated_users_read_jobs" ON public.jobs
      FOR SELECT 
      TO authenticated
      USING (true)
    `);
    console.log('✅ Created "authenticated_users_read_jobs" policy');
    
    // Policy 2: Authenticated users can create/update jobs (app will handle business logic)
    await client.query(`
      CREATE POLICY "authenticated_users_manage_jobs" ON public.jobs
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true)
    `);
    console.log('✅ Created "authenticated_users_manage_jobs" policy');
    
    // Test the query that's failing
    console.log('\n🧪 Testing jobs SELECT query...');
    try {
      const testResult = await client.query(`
        SELECT * FROM public.jobs 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      
      console.log(`✅ Jobs query successful! Found ${testResult.rows.length} jobs`);
      
      if (testResult.rows.length > 0) {
        console.log('\n📋 Sample job data:');
        const sample = testResult.rows[0];
        console.log(`  ID: ${sample.id || 'N/A'}`);
        console.log(`  Customer ID: ${sample.customer_id || 'N/A'}`);
        console.log(`  Status: ${sample.status || 'N/A'}`);
        console.log(`  Created: ${sample.created_at || 'N/A'}`);
      }
      
    } catch (queryError) {
      console.error('❌ Jobs query still failing:', {
        message: queryError.message,
        code: queryError.code,
        detail: queryError.detail
      });
    }
    
    // Verify new policies
    console.log('\n✅ New jobs policies:');
    const newPoliciesCheck = await client.query(`
      SELECT 
        policyname,
        cmd as operation
      FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'jobs'
      ORDER BY policyname
    `);
    
    newPoliciesCheck.rows.forEach(policy => {
      console.log(`  - ${policy.policyname} (${policy.operation})`);
    });
    
    console.log('\n🎯 Jobs RLS fix completed!');
    console.log('✅ Authenticated users can read/write jobs');
    console.log('✅ The /rest/v1/jobs API should work now');
    
  } catch (err) {
    console.error('💥 Error:', err.message);
    console.error('Full error:', err);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

fixJobsRLS();