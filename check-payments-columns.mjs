import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Create Supabase client with service role key for full access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPaymentsColumns() {
  console.log('Checking payments table column schema...');
  
  try {
    // Get column information
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, character_maximum_length')
      .eq('table_name', 'payments')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (error) {
      console.error('Error fetching column info:', error);
      return;
    }

    console.log('Payments table columns:');
    data.forEach(column => {
      if (column.data_type === 'character varying') {
        console.log(`  ${column.column_name}: VARCHAR(${column.character_maximum_length})`);
      } else {
        console.log(`  ${column.column_name}: ${column.data_type}`);
      }
    });
  } catch (error) {
    console.error('Error checking payments columns:', error);
  }
}

checkPaymentsColumns();