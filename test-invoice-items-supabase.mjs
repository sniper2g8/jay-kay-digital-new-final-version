import { createClient } from '@supabase/supabase-js';

// Load environment variables
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use service role key for full access
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInvoiceItems() {
  console.log('Testing invoice items access with service role key...');
  
  try {
    // Test fetching invoice items
    const { data, error } = await supabase
      .from('invoice_items')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Error fetching invoice items:', error);
      return;
    }
    
    console.log('Successfully fetched invoice items:', data?.length || 0, 'items');
    
    // Test with a specific invoice ID
    const testId = 'test-id';
    const { data: specificData, error: specificError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', testId);
      
    if (specificError) {
      console.error('Error fetching specific invoice items:', specificError);
      return;
    }
    
    console.log('Successfully fetched specific invoice items:', specificData?.length || 0, 'items');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testInvoiceItems();