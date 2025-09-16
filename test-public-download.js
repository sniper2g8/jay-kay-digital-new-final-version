const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testPublicBucketDownload() {
  console.log('🧪 Testing public bucket download...');
  
  try {
    const filePath = 'jobs/550e8400-e29b-41d4-a716-446655440000/1758008119658_CFAO_invitation_FV_-_200_copies.pdf';
    
    // Test 1: Get public URL
    console.log('\n1. Getting public URL...');
    const { data: urlData } = supabase.storage
      .from('job-files')
      .getPublicUrl(filePath);
    
    console.log('🔗 Public URL:', urlData.publicUrl);
    
    // Test 2: Try to access the public URL
    console.log('\n2. Testing public URL access...');
    const response = await fetch(urlData.publicUrl);
    
    if (response.ok) {
      console.log('✅ Public URL is accessible!');
      console.log('📊 Response status:', response.status);
      console.log('📏 Content length:', response.headers.get('content-length'));
      console.log('📄 Content type:', response.headers.get('content-type'));
    } else {
      console.log('❌ Public URL returned:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
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

testPublicBucketDownload();