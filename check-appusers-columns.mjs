import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local specifically
const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
  console.log('✅ Loaded environment variables from .env.local');
} else {
  console.log('❌ .env.local file not found');
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  console.log('❌ Missing required environment variables');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    persistSession: false
  }
});

async function checkAppUsersColumns() {
  console.log('🔍 Checking appUsers table columns...\n');
  
  try {
    // Try to get column information
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'appUsers')
      .order('ordinal_position');
    
    if (error) {
      console.log('❌ Error checking appUsers columns:', error.message);
      
      // Try a different approach - describe the table structure
      console.log('\nTrying to get table structure...');
      const { data: sampleData, error: sampleError } = await supabase
        .from('appUsers')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.log('❌ Error getting sample data:', sampleError.message);
      } else if (sampleData && sampleData.length > 0) {
        console.log('✅ Sample data columns:');
        Object.keys(sampleData[0]).forEach(column => {
          console.log(`  - ${column}`);
        });
      } else {
        console.log('✅ Table exists but is empty');
      }
    } else {
      console.log('✅ appUsers table columns:');
      data.forEach(column => {
        console.log(`  - ${column.column_name} (${column.data_type})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error in check appUsers columns:', error.message);
  }
}

// Run the function
checkAppUsersColumns();