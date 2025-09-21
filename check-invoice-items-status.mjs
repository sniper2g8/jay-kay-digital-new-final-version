import { createClient } from '@supabase/supabase-js';
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
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkInvoiceItemsTable() {
  console.log('Checking invoice_items table...');
  
  try {
    // Check if the table exists and RLS status
    const { data, error } = await supabase.rpc('get_rls_status', {
      table_name: 'invoice_items'
    });
    
    if (error) {
      console.log('Could not use get_rls_status RPC, checking directly...');
      
      // Alternative approach
      const { data: tableData, error: tableError } = await supabase
        .from('pg_class')
        .select('relname, relrowsecurity')
        .eq('relname', 'invoice_items');
        
      if (tableError) {
        console.error('Error checking table:', tableError);
        return;
      }
      
      if (tableData.length > 0) {
        console.log('Table invoice_items exists');
        console.log('RLS enabled:', tableData[0].relrowsecurity);
      } else {
        console.log('Table invoice_items does not exist');
      }
    } else {
      console.log('RLS status:', data);
    }
    
    // Check existing policies
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'invoice_items');
      
    if (policiesError) {
      console.error('Error checking policies:', policiesError);
    } else {
      console.log('Existing policies:', policies);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkInvoiceItemsTable();