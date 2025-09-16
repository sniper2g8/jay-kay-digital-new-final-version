// Check and fix storage policies for file uploads
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fixStoragePolicies() {
  let client;
  try {
    client = await pool.connect();
    
    console.log('🔧 Fixing Storage Policies for File Uploads...');
    console.log('==============================================');
    
    // Check current storage policies
    console.log('\n📋 Current storage policies:');
    const storageObjectsResult = await client.query(`
      SELECT 
        policyname,
        permissive,
        roles,
        cmd,
        qual
      FROM pg_policies 
      WHERE schemaname = 'storage' AND tablename = 'objects'
      ORDER BY policyname
    `);
    
    if (storageObjectsResult.rows.length === 0) {
      console.log('❌ No storage policies found!');
    } else {
      storageObjectsResult.rows.forEach(policy => {
        console.log(`  - ${policy.policyname} (${policy.cmd})`);
      });
    }
    
    console.log('\n🗑️  Dropping existing storage policies...');
    
    // Drop all existing storage policies
    const existingPolicies = await client.query(`
      SELECT policyname FROM pg_policies 
      WHERE schemaname = 'storage' AND tablename = 'objects'
    `);
    
    for (const policy of existingPolicies.rows) {
      await client.query(`DROP POLICY IF EXISTS "${policy.policyname}" ON storage.objects`);
      console.log(`  ✅ Dropped: ${policy.policyname}`);
    }
    
    console.log('\n🔧 Creating new storage policies...');
    
    // Policy 1: Authenticated users can upload files
    await client.query(`
      CREATE POLICY "authenticated_users_upload" ON storage.objects
      FOR INSERT 
      TO authenticated
      WITH CHECK (true)
    `);
    console.log('✅ Created "authenticated_users_upload" policy');
    
    // Policy 2: Authenticated users can view files
    await client.query(`
      CREATE POLICY "authenticated_users_view" ON storage.objects
      FOR SELECT
      TO authenticated
      USING (true)
    `);
    console.log('✅ Created "authenticated_users_view" policy');
    
    // Policy 3: Authenticated users can update their uploads
    await client.query(`
      CREATE POLICY "authenticated_users_update" ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true)
    `);
    console.log('✅ Created "authenticated_users_update" policy');
    
    // Policy 4: Authenticated users can delete files
    await client.query(`
      CREATE POLICY "authenticated_users_delete" ON storage.objects
      FOR DELETE
      TO authenticated
      USING (true)
    `);
    console.log('✅ Created "authenticated_users_delete" policy');
    
    // Also check and fix file_attachments table policies
    console.log('\n🔧 Fixing file_attachments table policies...');
    
    const attachmentPolicies = await client.query(`
      SELECT policyname FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'file_attachments'
    `);
    
    // Drop existing file_attachments policies
    for (const policy of attachmentPolicies.rows) {
      await client.query(`DROP POLICY IF EXISTS "${policy.policyname}" ON public.file_attachments`);
      console.log(`  ✅ Dropped file_attachments policy: ${policy.policyname}`);
    }
    
    // Create simple file_attachments policies
    await client.query(`
      CREATE POLICY "authenticated_access_file_attachments" ON public.file_attachments
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true)
    `);
    console.log('✅ Created file_attachments access policy');
    
    // Test storage access
    console.log('\n🧪 Testing storage setup...');
    
    const testResult = await client.query(`
      SELECT COUNT(*) as bucket_count
      FROM storage.buckets 
      WHERE name = 'job-files'
    `);
    
    console.log(`✅ job-files bucket exists: ${testResult.rows[0].bucket_count > 0 ? 'Yes' : 'No'}`);
    
    // Verify new policies
    console.log('\n📋 New storage policies:');
    const newPoliciesResult = await client.query(`
      SELECT policyname, cmd 
      FROM pg_policies 
      WHERE schemaname = 'storage' AND tablename = 'objects'
      ORDER BY policyname
    `);
    
    newPoliciesResult.rows.forEach(policy => {
      console.log(`  - ${policy.policyname} (${policy.cmd})`);
    });
    
    console.log('\n🎯 Storage Policies Fixed!');
    console.log('✅ Authenticated users can upload, view, update, and delete files');
    console.log('✅ file_attachments table is accessible to authenticated users');
    console.log('✅ Ready for file upload implementation');
    
  } catch (err) {
    console.error('💥 Error:', err.message);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

fixStoragePolicies();