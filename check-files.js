const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkExistingFiles() {
  console.log('📁 Checking existing file records...');
  
  try {
    const { data, error } = await supabase
      .from('file_attachments')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Error querying files:', error);
    } else {
      console.log(`✅ Found ${data.length} file records`);
      data.forEach((file, index) => {
        console.log(`\nFile ${index + 1}:`);
        console.log('  ID:', file.id);
        console.log('  Name:', file.file_name);
        console.log('  URL:', file.file_url);
        console.log('  Entity ID:', file.entity_id);
        console.log('  Entity Type:', file.entity_type);
        console.log('  Size:', file.file_size);
        console.log('  Type:', file.file_type);
      });
    }
  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

checkExistingFiles();