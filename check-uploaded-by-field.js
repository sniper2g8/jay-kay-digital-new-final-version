require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUploadedByField() {
  try {
    console.log('🔍 Checking uploaded_by field in file_attachments...');
    
    // Check existing data to understand the uploaded_by field
    const { data: existingData, error: existingError } = await supabase
      .from('file_attachments')
      .select('uploaded_by')
      .limit(3);
    
    if (existingError) {
      console.error('❌ Error checking existing data:', existingError);
      return;
    }
    
    if (existingData && existingData.length > 0) {
      console.log('📋 Sample uploaded_by values:');
      existingData.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.uploaded_by || 'NULL'} (type: ${typeof item.uploaded_by})`);
      });
    } else {
      console.log('📭 No existing file attachments found');
    }
    
    // Try to get column info from a simple query
    console.log('\n🔍 Getting column info from sample query...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('file_attachments')
      .select('*')
      .limit(1);
      
    if (sampleError) {
      console.error('❌ Error getting sample data:', sampleError);
      return;
    }
    
    if (sampleData && sampleData.length > 0) {
      console.log('📋 Column names from sample data:');
      Object.keys(sampleData[0]).forEach(col => {
        console.log(`  - ${col}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

checkUploadedByField().catch(console.error);