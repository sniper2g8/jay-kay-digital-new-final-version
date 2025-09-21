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
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkInvoiceItemsRLS() {
  console.log('Checking RLS status for invoice_items table...');
  
  try {
    // Check if RLS is enabled on the table
    const { data: rlsData, error: rlsError } = await supabase.rpc('get_rls_status', {
      table_name: 'invoice_items'
    });
    
    if (rlsError) {
      console.log('Could not check RLS status via RPC, checking directly...');
      
      // Alternative approach - check table info directly
      const { data: tableData, error: tableError } = await supabase
        .from('pg_tables')
        .select('*')
        .eq('tablename', 'invoice_items');
        
      if (tableError) {
        console.error('Error checking table info:', tableError);
        return;
      }
      
      console.log('Table info:', tableData);
    } else {
      console.log('RLS status:', rlsData);
    }
    
    // Try to access with service role key
    console.log('Testing access with service role key...');
    const { data, error } = await supabase
      .from('invoice_items')
      .select('count()');
      
    if (error) {
      console.error('Service role access failed:', error);
      return;
    }
    
    console.log('Service role access successful, count:', data);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkInvoiceItemsRLS();