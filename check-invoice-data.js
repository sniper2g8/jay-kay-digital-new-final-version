const { Client } = require('pg');

// Database connection configuration
const client = new Client({
  host: 'aws-1-eu-west-2.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.pnoxqzlxfuvjvufdjuqh',
  password: '...()Admin@1',
  ssl: { rejectUnauthorized: false }
});

async function checkInvoiceData() {
  try {
    console.log('🔍 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    // Check if invoices table exists and has data
    console.log('\n📋 Checking invoices table structure...');
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' 
      ORDER BY ordinal_position;
    `);
    console.log('Invoices table columns:', tableInfo.rows);

    // Check total invoice count
    console.log('\n📊 Checking total invoice count...');
    const countResult = await client.query('SELECT COUNT(*) as total FROM invoices;');
    console.log('Total invoices:', countResult.rows[0].total);

    // Get sample invoices
    console.log('\n📄 Sample invoices (first 5):');
    const sampleInvoices = await client.query(`
      SELECT 
        id, 
        "invoiceNo", 
        customer_id, 
        total, 
        status, 
        payment_status,
        invoice_status,
        "issueDate",
        "dueDate",
        created_at
      FROM invoices 
      ORDER BY created_at DESC 
      LIMIT 5;
    `);
    console.log('Sample invoices:', JSON.stringify(sampleInvoices.rows, null, 2));

    // Check if customers table exists and has data
    console.log('\n👥 Checking customers table...');
    const customerCount = await client.query('SELECT COUNT(*) as total FROM customers;');
    console.log('Total customers:', customerCount.rows[0].total);

    // Test invoice-customer join
    console.log('\n🔗 Testing invoice-customer join...');
    const invoicesWithCustomers = await client.query(`
      SELECT 
        i.id,
        i."invoiceNo",
        i.total,
        i.status,
        i.payment_status,
        c.business_name,
        c.contact_person,
        c.email
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      ORDER BY i.created_at DESC
      LIMIT 3;
    `);
    console.log('Invoices with customers:', JSON.stringify(invoicesWithCustomers.rows, null, 2));

    // Check invoice_items table
    console.log('\n📝 Checking invoice_items table...');
    try {
      const itemsCount = await client.query('SELECT COUNT(*) as total FROM invoice_items;');
      console.log('Total invoice items:', itemsCount.rows[0].total);
      
      const sampleItems = await client.query(`
        SELECT 
          ii.*,
          i.invoice_no
        FROM invoice_items ii
        LEFT JOIN invoices i ON ii.invoice_id = i.id
        LIMIT 3;
      `);
      console.log('Sample invoice items:', JSON.stringify(sampleItems.rows, null, 2));
    } catch (error) {
      console.log('Error checking invoice_items:', error.message);
    }

    // Check RLS policies
    console.log('\n🔒 Checking RLS policies...');
    const rlsPolicies = await client.query(`
      SELECT 
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual
      FROM pg_policies 
      WHERE tablename IN ('invoices', 'customers', 'invoice_items')
      ORDER BY tablename, policyname;
    `);
    console.log('RLS Policies:', JSON.stringify(rlsPolicies.rows, null, 2));

    // Test basic Supabase-style query
    console.log('\n🧪 Testing Supabase-style query simulation...');
    const supabaseStyleQuery = await client.query(`
      SELECT 
        invoices.*,
        customers.business_name as customer_name,
        customers.contact_person,
        customers.email as customer_email
      FROM invoices
      LEFT JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.created_at DESC
      LIMIT 5;
    `);
    console.log('Supabase-style query result:', JSON.stringify(supabaseStyleQuery.rows, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the check
checkInvoiceData().catch(console.error);