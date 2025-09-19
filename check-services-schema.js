require('dotenv').config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkServicesTableSchema() {
  try {
    console.log('🔍 Checking services table schema...');

    // Try to get column information
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error accessing services table:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Services table columns:');
      const columns = Object.keys(data[0]);
      columns.forEach(col => console.log(`  - ${col}`));
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

checkServicesTableSchema().catch(console.error);