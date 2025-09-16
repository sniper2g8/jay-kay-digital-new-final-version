// Debug and test Supabase Storage setup
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function debugSupabaseStorage() {
  let client;
  try {
    client = await pool.connect();
    
    console.log('🔍 Debugging Supabase Storage Setup...');
    console.log('=====================================');
    
    // Check if storage buckets exist in the database
    const bucketsResult = await client.query(`
      SELECT 
        name,
        id,
        created_at,
        updated_at,
        public as is_public
      FROM storage.buckets
      ORDER BY created_at DESC
    `);
    
    console.log('\n📦 Storage Buckets:');
    if (bucketsResult.rows.length === 0) {
      console.log('❌ No storage buckets found!');
      console.log('💡 You need to create storage buckets in Supabase Dashboard');
    } else {
      bucketsResult.rows.forEach(bucket => {
        console.log(`  - ${bucket.name} (${bucket.is_public ? 'Public' : 'Private'}) - Created: ${bucket.created_at}`);
      });
    }
    
    // Check for file_attachments table structure
    console.log('\n📋 Checking file_attachments table...');
    try {
      const attachmentsColumns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'file_attachments'
        ORDER BY ordinal_position
      `);
      
      if (attachmentsColumns.rows.length === 0) {
        console.log('❌ file_attachments table not found!');
        console.log('💡 Need to create file_attachments table');
      } else {
        console.log('✅ file_attachments table found with columns:');
        attachmentsColumns.rows.forEach(col => {
          console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
      }
    } catch (err) {
      console.log('❌ Error checking file_attachments table:', err.message);
    }
    
    // Check jobs table for file-related columns
    console.log('\n📋 Checking jobs table for file columns...');
    const jobsColumns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'jobs'
      AND column_name LIKE '%file%'
      ORDER BY ordinal_position
    `);
    
    if (jobsColumns.rows.length > 0) {
      console.log('✅ File-related columns in jobs table:');
      jobsColumns.rows.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log('⚠️  No file-related columns found in jobs table');
    }
    
    // Check existing file records
    try {
      const fileCount = await client.query('SELECT COUNT(*) as count FROM public.file_attachments');
      console.log(`\n📊 Current file attachments: ${fileCount.rows[0].count} records`);
      
      if (fileCount.rows[0].count > 0) {
        const sampleFiles = await client.query(`
          SELECT entity_type, entity_id, filename, file_path, created_at
          FROM public.file_attachments 
          ORDER BY created_at DESC 
          LIMIT 3
        `);
        
        console.log('\n📄 Sample file records:');
        sampleFiles.rows.forEach(file => {
          console.log(`  - ${file.filename} (${file.entity_type}:${file.entity_id})`);
          console.log(`    Path: ${file.file_path}`);
        });
      }
    } catch (err) {
      console.log('⚠️  Could not query file_attachments:', err.message);
    }
    
    console.log('\n🔧 Recommendations:');
    console.log('==================');
    
    if (bucketsResult.rows.length === 0) {
      console.log('1. Create storage buckets in Supabase Dashboard:');
      console.log('   - Go to Storage in Supabase Dashboard');
      console.log('   - Create bucket named "job-files" (public)');
      console.log('   - Set appropriate policies');
    }
    
    console.log('2. Test file upload with simpler approach');
    console.log('3. Check storage policies (RLS) for authenticated users');
    console.log('4. Verify bucket public access settings');
    
  } catch (err) {
    console.error('💥 Error:', err.message);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

debugSupabaseStorage();