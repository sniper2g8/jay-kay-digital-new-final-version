const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

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

async function makeJobFilesBucketPublic() {
  console.log('🔧 Making job-files bucket public...');
  
  try {
    // Step 1: Backup existing files first
    console.log('\n1. Downloading existing files for backup...');
    
    const existingFile = 'jobs/550e8400-e29b-41d4-a716-446655440000/1758008119658_CFAO_invitation_FV_-_200_copies.pdf';
    console.log(`📁 Backing up: ${existingFile}`);
    
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('job-files')
      .download(existingFile);
    
    if (downloadError) {
      console.error('❌ Error downloading existing file:', downloadError);
      return;
    }
    
    console.log('✅ File backup successful, size:', fileData.size, 'bytes');
    
    // Step 2: Delete the old private bucket
    console.log('\n2. Deleting old private bucket...');
    
    const { error: deleteError } = await supabaseAdmin.storage.deleteBucket('job-files');
    
    if (deleteError) {
      console.error('❌ Error deleting bucket:', deleteError);
      // Don't return here, the bucket might have files that prevent deletion
      console.log('⚠️  Continuing anyway...');
    } else {
      console.log('✅ Old bucket deleted');
    }
    
    // Step 3: Create new public bucket
    console.log('\n3. Creating new public bucket...');
    
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
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ],
      fileSizeLimit: 10485760 // 10MB
    });
    
    if (createError) {
      if (createError.message.includes('already exists')) {
        console.log('✅ Bucket already exists, checking if it\'s public...');
        
        // Check bucket settings
        const { data: buckets } = await supabaseAdmin.storage.listBuckets();
        const jobFilesBucket = buckets?.find(b => b.name === 'job-files');
        
        if (jobFilesBucket?.public) {
          console.log('✅ Bucket is already public!');
        } else {
          console.log('❌ Bucket exists but is still private. Manual intervention needed.');
          console.log('🔧 Please make the bucket public via Supabase Dashboard:');
          console.log('   1. Go to Storage in Supabase Dashboard');
          console.log('   2. Find job-files bucket');
          console.log('   3. Edit bucket settings');
          console.log('   4. Set Public bucket to ON');
          return;
        }
      } else {
        console.error('❌ Error creating bucket:', createError);
        return;
      }
    } else {
      console.log('✅ New public bucket created:', createData);
    }
    
    // Step 4: Re-upload the backed up file
    console.log('\n4. Restoring backed up file...');
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('job-files')
      .upload(existingFile, fileData, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      console.error('❌ Error restoring file:', uploadError);
    } else {
      console.log('✅ File restored successfully:', uploadData.path);
    }
    
    // Step 5: Test public URL access
    console.log('\n5. Testing public URL access...');
    
    const { data: urlData } = supabaseAdmin.storage
      .from('job-files')
      .getPublicUrl(existingFile);
    
    console.log('🔗 Public URL:', urlData.publicUrl);
    
    // Test if the URL is accessible
    try {
      const response = await fetch(urlData.publicUrl);
      if (response.ok) {
        console.log('✅ Public URL is accessible!');
        console.log('📊 Response status:', response.status);
        console.log('📏 Content length:', response.headers.get('content-length'));
      } else {
        console.log('❌ Public URL returned:', response.status, response.statusText);
      }
    } catch (fetchError) {
      console.error('❌ Error testing public URL:', fetchError.message);
    }
    
  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

makeJobFilesBucketPublic();