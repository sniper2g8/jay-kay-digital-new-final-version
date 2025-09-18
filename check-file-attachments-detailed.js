require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFileAttachmentsDetailedSchema() {
  try {
    console.log('🔍 Checking detailed file_attachments table schema...');

    // Get schema from information schema
    const { data: schemaData, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'file_attachments')
      .order('ordinal_position');
    
    if (schemaError) {
      console.error('❌ Error getting schema:', schemaError);
      return;
    }
    
    console.log('📋 file_attachments table schema:');
    schemaData.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULLABLE' : 'REQUIRED'}`);
    });
    
    // Check existing data to understand the uploaded_by field
    console.log('\n🔍 Checking existing uploaded_by values...');
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
        console.log(`  ${index + 1}. ${item.uploaded_by || 'NULL'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

checkFileAttachmentsDetailedSchema().catch(console.error);