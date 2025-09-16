const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkStorageBuckets() {
  console.log('🪣 Checking Supabase storage buckets...');
  
  try {
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error listing buckets:', error);
    } else {
      console.log('✅ Available buckets:');
      data.forEach(bucket => {
        console.log('  -', bucket.name, '(', bucket.public ? 'public' : 'private', ')');
      });
      
      // Check specifically for job-files bucket
      const jobFilesBucket = data.find(b => b.name === 'job-files');
      if (jobFilesBucket) {
        console.log('✅ job-files bucket found!');
        console.log('   Public:', jobFilesBucket.public);
        console.log('   Created:', jobFilesBucket.created_at);
      } else {
        console.log('❌ job-files bucket NOT found!');
        console.log('We need to create it...');
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

checkStorageBuckets();