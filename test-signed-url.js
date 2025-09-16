const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testSignedUrlDownload() {
  console.log('🧪 Testing signed URL download approach...');
  
  try {
    const filePath = 'jobs/550e8400-e29b-41d4-a716-446655440000/1758008119658_CFAO_invitation_FV_-_200_copies.pdf';
    
    // Test 1: Create signed URL
    console.log('\n1. Creating signed URL...');
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('job-files')
      .createSignedUrl(filePath, 3600);
    
    if (signedUrlError) {
      console.error('❌ Error creating signed URL:', signedUrlError);
      return;
    }
    
    console.log('✅ Signed URL created:', signedUrlData.signedUrl);
    
    // Test 2: Try to access the signed URL
    console.log('\n2. Testing signed URL access...');
    const response = await fetch(signedUrlData.signedUrl);
    
    if (response.ok) {
      console.log('✅ Signed URL is accessible!');
      console.log('📊 Response status:', response.status);
      console.log('📏 Content length:', response.headers.get('content-length'));
      console.log('📄 Content type:', response.headers.get('content-type'));
    } else {
      console.log('❌ Signed URL returned:', response.status, response.statusText);
    }
    
    // Test 3: Try direct storage download
    console.log('\n3. Testing direct storage download...');
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from('job-files')
      .download(filePath);
    
    if (downloadError) {
      console.error('❌ Error with direct download:', downloadError);
    } else {
      console.log('✅ Direct download successful!');
      console.log('📏 File size:', downloadData.size, 'bytes');
      console.log('📄 File type:', downloadData.type);
    }
    
  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

testSignedUrlDownload();