const { Client } = require('pg');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

async function enableFullAccessRLS() {
  console.log('🔐 Enabling Full Access RLS Policies for Invoice Management...\n');

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected via direct database connection\n');

    // Create comprehensive RLS policies that allow both service role and anon access
    const rlsPolicies = [
      // Enable RLS on all existing tables that need it
      'ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE payments ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE customers ENABLE ROW LEVEL SECURITY;',
      
      // Drop existing policies that might be too restrictive
      'DROP POLICY IF EXISTS "Enable read access for all users" ON invoices;',
      'DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON invoices;',
      'DROP POLICY IF EXISTS "Enable update for authenticated users only" ON invoices;',
      'DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON invoices;',
      
      // Create permissive policies for invoices
      `CREATE POLICY "Allow all operations on invoices" ON invoices
        FOR ALL
        USING (true)
        WITH CHECK (true);`,
      
      // Create permissive policies for payments
      'DROP POLICY IF EXISTS "Enable read access for all users" ON payments;',
      'DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON payments;',
      'DROP POLICY IF EXISTS "Enable update for authenticated users only" ON payments;',
      'DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON payments;',
      
      `CREATE POLICY "Allow all operations on payments" ON payments
        FOR ALL
        USING (true)
        WITH CHECK (true);`,
      
      // Create permissive policies for customers
      'DROP POLICY IF EXISTS "Enable read access for all users" ON customers;',
      'DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON customers;',
      'DROP POLICY IF EXISTS "Enable update for authenticated users only" ON customers;',
      'DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON customers;',
      
      `CREATE POLICY "Allow all operations on customers" ON customers
        FOR ALL
        USING (true)
        WITH CHECK (true);`,
      
      // Ensure new tables have permissive policies
      `DROP POLICY IF EXISTS "Users can view all invoice templates" ON invoice_templates;`,
      `DROP POLICY IF EXISTS "Authenticated users can manage invoice templates" ON invoice_templates;`,
      
      `CREATE POLICY "Allow all operations on invoice_templates" ON invoice_templates
        FOR ALL
        USING (true)
        WITH CHECK (true);`,
      
      `DROP POLICY IF EXISTS "Users can view all payment allocations" ON payment_allocations;`,
      `DROP POLICY IF EXISTS "Authenticated users can manage payment allocations" ON payment_allocations;`,
      
      `CREATE POLICY "Allow all operations on payment_allocations" ON payment_allocations
        FOR ALL
        USING (true)
        WITH CHECK (true);`,
      
      `DROP POLICY IF EXISTS "Users can view invoice status history" ON invoice_status_history;`,
      `DROP POLICY IF EXISTS "Authenticated users can insert invoice status history" ON invoice_status_history;`,
      
      `CREATE POLICY "Allow all operations on invoice_status_history" ON invoice_status_history
        FOR ALL
        USING (true)
        WITH CHECK (true);`,
      
      `DROP POLICY IF EXISTS "Users can view all recurring invoices" ON recurring_invoices;`,
      `DROP POLICY IF EXISTS "Authenticated users can manage recurring invoices" ON recurring_invoices;`,
      
      `CREATE POLICY "Allow all operations on recurring_invoices" ON recurring_invoices
        FOR ALL
        USING (true)
        WITH CHECK (true);`,
      
      // Ensure invoice_line_items has proper policies
      `DROP POLICY IF EXISTS "Users can view all invoice line items" ON invoice_line_items;`,
      `DROP POLICY IF EXISTS "Authenticated users can manage invoice line items" ON invoice_line_items;`,
      
      `CREATE POLICY "Allow all operations on invoice_line_items" ON invoice_line_items
        FOR ALL
        USING (true)
        WITH CHECK (true);`
    ];

    console.log('🔓 Creating permissive RLS policies for development...\n');

    for (const policy of rlsPolicies) {
      try {
        await client.query(policy);
        console.log('✅ Policy executed successfully');
      } catch (error) {
        if (error.message.includes('already exists') || 
            error.message.includes('does not exist') ||
            error.message.includes('duplicate_object')) {
          console.log('⚠️  Policy already handled (skipping)');
        } else {
          console.log(`❌ Policy error: ${error.message}`);
        }
      }
    }

    console.log('\n🎉 Full Access RLS Policies Created!\n');
    console.log('📊 Policy Summary:');
    console.log('   ✅ All tables now allow full access for development');
    console.log('   ✅ Both service role and anon key can access data');
    console.log('   ✅ Invoice management system ready for testing');
    console.log('\n⚠️  Note: These are permissive policies for development');
    console.log('   In production, implement proper user-based access control');

  } catch (error) {
    console.error('❌ Failed to enable RLS policies:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n📡 Database connection closed');
  }
}

enableFullAccessRLS();