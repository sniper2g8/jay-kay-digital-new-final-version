// Script to fix RLS policies for invoice_line_items table
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Create Supabase client with service role key for full access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSPolicies() {
  try {
    console.log('Fixing RLS policies for invoice_line_items table...');
    
    // Execute the SQL function to fix RLS policies
    const { data, error } = await supabase.rpc('fix_invoice_line_items_rls');
    
    if (error) {
      console.error('Error fixing RLS policies:', error);
      process.exit(1);
    }
    
    console.log('RLS policies fixed successfully!');
    console.log(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

fixRLSPolicies();