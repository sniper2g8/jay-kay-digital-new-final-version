require('dotenv').config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFileAttachmentsSchema() {
  try {
    console.log('🔍 Checking file_attachments table schema...');

    // Try to get column information by selecting specific columns
    const { data, error } = await supabase
      .from('file_attachments')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error accessing file_attachments table:', error);
      
      // Try to get schema from information schema
      console.log('\n🔍 Trying to get schema from information_schema...');
      const { data: schemaData, error: schemaError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'file_attachments')
        .order('ordinal_position');
      
      if (schemaError) {
        console.error('❌ Error getting schema:', schemaError);
      } else {
        console.log('📋 file_attachments table schema:');
        schemaData.forEach(col => {
          console.log(`  - ${col.column_name} (${col.data_type})`);
        });
      }
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ file_attachments table columns:');
      const columns = Object.keys(data[0]);
      columns.forEach(col => console.log(`  - ${col}`));
    } else {
      console.log('📭 file_attachments table is empty, trying to get schema differently...');
      
      // Try to get schema from information schema
      const { data: schemaData, error: schemaError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'file_attachments')
        .order('ordinal_position');
      
      if (schemaError) {
        console.error('❌ Error getting schema:', schemaError);
      } else {
        console.log('📋 file_attachments table schema:');
        schemaData.forEach(col => {
          console.log(`  - ${col.column_name} (${col.data_type})`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

checkFileAttachmentsSchema().catch(console.error);