const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function debugStorageAccess() {
  console.log('🔍 Debugging storage access...');
  
  try {
    // 1. List all buckets
    console.log('\n1. Listing all buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
    } else {
      console.log('✅ Available buckets:');
      buckets.forEach(bucket => {
        console.log(`  - ${bucket.name} (public: ${bucket.public})`);
      });
    }
    
    // 2. Try to list files in job-files bucket
    console.log('\n2. Trying to list files in job-files bucket...');
    const { data: files, error: filesError } = await supabase.storage
      .from('job-files')
      .list('', { limit: 5 });
    
    if (filesError) {
      console.error('❌ Error listing files:', filesError);
    } else {
      console.log(`✅ Found ${files.length} files/folders in job-files bucket`);
      files.forEach(file => {
        console.log(`  - ${file.name} (${file.metadata?.size || 'unknown'} bytes)`);
      });
    }
    
    // 3. Try to access a specific file
    const testJobId = '550e8400-e29b-41d4-a716-446655440000';
    console.log(`\n3. Trying to list files for job ${testJobId}...`);
    const { data: jobFiles, error: jobFilesError } = await supabase.storage
      .from('job-files')
      .list(`jobs/${testJobId}`, { limit: 5 });
    
    if (jobFilesError) {
      console.error('❌ Error listing job files:', jobFilesError);
    } else {
      console.log(`✅ Found ${jobFiles.length} files for job ${testJobId}`);
      jobFiles.forEach(file => {
        console.log(`  - ${file.name} (${file.metadata?.size || 'unknown'} bytes)`);
      });
      
      // 4. Try to download a specific file if it exists
      if (jobFiles.length > 0) {
        const testFile = jobFiles[0];
        console.log(`\n4. Trying to download file: ${testFile.name}...`);
        const { data: downloadData, error: downloadError } = await supabase.storage
          .from('job-files')
          .download(`jobs/${testJobId}/${testFile.name}`);
        
        if (downloadError) {
          console.error('❌ Error downloading file:', downloadError);
        } else {
          console.log('✅ File download successful, size:', downloadData.size, 'bytes');
        }
      }
    }
    
  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

debugStorageAccess();