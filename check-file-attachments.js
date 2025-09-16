const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkFileAttachmentsTable() {
  console.log('🔍 Checking file_attachments table structure...');
  
  try {
    const { data, error } = await supabase
      .from('file_attachments')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying file_attachments:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
    } else {
      console.log('✅ Table accessible. Sample record count:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('📋 Sample record structure:', Object.keys(data[0]));
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

checkFileAttachmentsTable();