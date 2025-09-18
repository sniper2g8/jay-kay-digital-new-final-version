require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExistingFileAttachments() {
  try {
    console.log('🔍 Checking existing file_attachments data...');

    // Try to get some existing file attachments
    const { data, error } = await supabase
      .from('file_attachments')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Error accessing file_attachments table:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log(`✅ Found ${data.length} file attachments:`);
      data.forEach((attachment, index) => {
        console.log(`\n📋 Attachment ${index + 1}:`);
        console.log(`  - ID: ${attachment.id}`);
        console.log(`  - Entity Type: ${attachment.entity_type}`);
        console.log(`  - Entity ID: ${attachment.entity_id}`);
        console.log(`  - File Name: ${attachment.file_name}`);
        console.log(`  - File Type: ${attachment.file_type}`);
        console.log(`  - File Size: ${attachment.file_size}`);
      });
    } else {
      console.log('📭 No file attachments found in the database');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

checkExistingFileAttachments().catch(console.error);