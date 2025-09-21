import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Create Supabase client with service role key for full access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkInvoicesRLS() {
  console.log('Checking invoices table RLS policies...');
  
  // This would require using the Supabase management API or checking directly in the database
  // For now, let's test if we can update an invoice using the service role client
  const { data: testInvoice, error: fetchError } = await supabase
    .from('invoices')
    .select('id')
    .limit(1)
    .single();

  if (fetchError) {
    console.error('Error fetching test invoice:', fetchError);
    return;
  }

  console.log('Test invoice ID:', testInvoice.id);
  
  // Try to update with service role client
  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      invoice_status: 'draft',
      updated_at: new Date().toISOString(),
    })
    .eq('id', testInvoice.id);

  if (updateError) {
    console.error('Error updating invoice with service role client:', updateError);
  } else {
    console.log('Successfully updated invoice with service role client');
  }
}

checkInvoicesRLS();