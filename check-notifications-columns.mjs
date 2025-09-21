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

async function checkNotificationsColumns() {
  console.log('🔍 Checking notifications table columns...\n');
  
  try {
    // Try to get column information
    console.log('\nTrying to get table structure...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('notifications')
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
    
  } catch (error) {
    console.error('❌ Error in check notifications columns:', error.message);
  }
}

// Run the function
checkNotificationsColumns();