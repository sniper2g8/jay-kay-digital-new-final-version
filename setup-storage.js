const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Use service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createAndConfigureBucket() {
  console.log('🪣 Creating and configuring job-files bucket with admin privileges...');
  
  try {
    // 1. First, let's see what buckets exist
    console.log('\n1. Checking existing buckets...');
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }
    
    console.log('✅ Existing buckets:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (public: ${bucket.public})`);
    });
    
    // 2. Check if job-files bucket exists
    const jobFilesBucket = buckets.find(b => b.name === 'job-files');
    
    if (!jobFilesBucket) {
      console.log('\n2. Creating job-files bucket...');
      const { data: createData, error: createError } = await supabaseAdmin.storage.createBucket('job-files', {
        public: true,
        allowedMimeTypes: [
          'application/pdf',
          'image/jpeg',
          'image/png', 
          'image/gif',
          'image/webp',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'text/csv'
        ],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (createError) {
        console.error('❌ Error creating bucket:', createError);
        return;
      }
      
      console.log('✅ Bucket created successfully:', createData);
    } else {
      console.log('✅ job-files bucket already exists');
    }
    
    // 3. Test uploading a small test file
    console.log('\n3. Testing file upload...');
    const testContent = 'This is a test file for job-files bucket';
    const testFileName = 'test-upload.txt';
    const testPath = `test/${testFileName}`;
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('job-files')
      .upload(testPath, new Blob([testContent], { type: 'text/plain' }), {
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      console.error('❌ Error uploading test file:', uploadError);
    } else {
      console.log('✅ Test file uploaded successfully:', uploadData.path);
      
      // 4. Test getting public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('job-files')
        .getPublicUrl(testPath);
      
      console.log('✅ Public URL generated:', urlData.publicUrl);
      
      // 5. Test downloading the file
      const { data: downloadData, error: downloadError } = await supabaseAdmin.storage
        .from('job-files')
        .download(testPath);
      
      if (downloadError) {
        console.error('❌ Error downloading test file:', downloadError);
      } else {
        console.log('✅ Test file downloaded successfully, size:', downloadData.size, 'bytes');
      }
      
      // 6. Clean up test file
      const { error: deleteError } = await supabaseAdmin.storage
        .from('job-files')
        .remove([testPath]);
      
      if (deleteError) {
        console.warn('⚠️  Could not delete test file:', deleteError);
      } else {
        console.log('✅ Test file cleaned up');
      }
    }
    
  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

createAndConfigureBucket();