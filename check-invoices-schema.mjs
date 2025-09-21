import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Create Supabase client with service role key for full access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkInvoicesSchema() {
  console.log('Checking invoices table schema...');
  
  // Get a sample invoice record
  const { data: sampleInvoice, error: sampleError } = await supabase
    .from('invoices')
    .select('*')
    .limit(1)
    .single();

  if (sampleError) {
    console.error('Error fetching sample invoice:', sampleError);
    return;
  }

  console.log('Sample invoice record:');
  console.log(JSON.stringify(sampleInvoice, null, 2));

  // Check field lengths for VARCHAR fields
  console.log('\nField lengths:');
  for (const [key, value] of Object.entries(sampleInvoice)) {
    if (typeof value === 'string') {
      console.log(`  ${key}: ${value.length} characters`);
    }
  }
}

checkInvoicesSchema();