import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Create Supabase client with service role key for full access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPaymentsSchemaDirect() {
  console.log('Checking payments table schema directly...');
  
  try {
    // Try to get schema info using raw SQL
    const { data, error } = await supabase.rpc('execute_sql', {
      sql: `
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `
    });

    if (error) {
      console.error('Error fetching schema info:', error);
      // Let's try a simpler approach - insert a test record and see what happens
      console.log('Trying to insert a minimal test record...');
      
      const testPayment = {
        customer_human_id: 'TEST-CUS-001',
        invoice_no: 'TEST-INV-001',
        amount: 100,
        payment_method: 'cash',
        payment_date: '2025-01-01',
        payment_status: 'completed',
        payment_number: 'PAY-000001'
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('payments')
        .insert([testPayment])
        .select()
        .single();
        
      if (insertError) {
        console.error('Error inserting test record:', insertError);
        // Try with progressively shorter fields to identify the problematic one
        const testFields = [
          { name: 'customer_human_id', value: 'TEST-CUS-001' },
          { name: 'invoice_no', value: 'TEST-INV-001' },
          { name: 'payment_method', value: 'cash' },
          { name: 'payment_date', value: '2025-01-01' },
          { name: 'payment_status', value: 'completed' },
          { name: 'payment_number', value: 'PAY-000001' },
          { name: 'reference_number', value: 'REF-001' },
          { name: 'notes', value: 'Test payment notes' }
        ];
        
        for (const field of testFields) {
          const testData = { ...testPayment, [field.name]: field.value };
          const { error: fieldError } = await supabase
            .from('payments')
            .insert([testData])
            .select()
            .single();
            
          if (fieldError) {
            console.log(`Field ${field.name} with value "${field.value}" causes error:`, fieldError.message);
          } else {
            console.log(`Field ${field.name} with value "${field.value}" is OK`);
            // Clean up the test record
            await supabase.from('payments').delete().eq('payment_number', 'PAY-000001');
          }
        }
      } else {
        console.log('Test record inserted successfully');
        // Clean up the test record
        await supabase.from('payments').delete().eq('payment_number', 'PAY-000001');
      }
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
    console.error('Error checking payments schema:', error);
  }
}

checkPaymentsSchemaDirect();