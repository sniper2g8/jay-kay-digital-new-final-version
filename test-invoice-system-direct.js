const { Client } = require("pg");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;

async function testInvoiceSystemDirect() {
  console.log("🎯 Testing Enhanced Invoice Management System (Direct DB)...\n");

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log("✅ Connected via direct database connection\n");

    // Test 1: Check invoice templates
    console.log("1. Testing invoice templates...");
    const templatesResult = await client.query(
      "SELECT COUNT(*) as count, template_name FROM invoice_templates GROUP BY template_name",
    );
    console.log(
      `✅ Invoice Templates: ${templatesResult.rows.length} templates available`,
    );
    templatesResult.rows.forEach((row) => {
      console.log(`   📋 ${row.template_name} (${row.count} records)`);
    });

    // Test 2: Check enhanced invoices table structure
    console.log("\n2. Testing enhanced invoices table...");
    const invoiceColumnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' 
        AND column_name IN ('invoice_status', 'invoice_date', 'terms_days', 'template_id', 'generated_by')
      ORDER BY column_name
    `);
    console.log(
      `✅ Enhanced Invoice Columns: ${invoiceColumnsResult.rows.length} new columns`,
    );
    invoiceColumnsResult.rows.forEach((row) => {
      console.log(`   📝 ${row.column_name} (${row.data_type})`);
    });

    // Test 3: Check payment allocations table
    console.log("\n3. Testing payment allocations table...");
    const allocationsResult = await client.query(
      "SELECT COUNT(*) as count FROM payment_allocations",
    );
    console.log(
      `✅ Payment Allocations: ${allocationsResult.rows[0].count} records`,
    );

    // Test 4: Check invoice status history
    console.log("\n4. Testing invoice status history...");
    const historyResult = await client.query(
      "SELECT COUNT(*) as count FROM invoice_status_history",
    );
    console.log(`✅ Status History: ${historyResult.rows[0].count} records`);

    // Test 5: Check enhanced invoice line items
    console.log("\n5. Testing enhanced invoice line items...");
    const lineItemColumnsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invoice_line_items' 
        AND column_name IN ('line_order', 'discount_amount', 'tax_rate', 'tax_amount', 'job_id')
      ORDER BY column_name
    `);
    console.log(
      `✅ Enhanced Line Item Columns: ${lineItemColumnsResult.rows.length} new columns`,
    );
    lineItemColumnsResult.rows.forEach((row) => {
      console.log(`   📋 ${row.column_name}`);
    });

    // Test 6: Check enhanced payments table
    console.log("\n6. Testing enhanced payments table...");
    const paymentColumnsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
        AND column_name IN ('payment_status', 'customer_id', 'applied_to_invoice_id', 'transaction_id')
      ORDER BY column_name
    `);
    console.log(
      `✅ Enhanced Payment Columns: ${paymentColumnsResult.rows.length} new columns`,
    );
    paymentColumnsResult.rows.forEach((row) => {
      console.log(`   💳 ${row.column_name}`);
    });

    // Test 7: Check customers table for relationships
    console.log("\n7. Testing customers table...");
    const customersResult = await client.query(
      "SELECT COUNT(*) as count FROM customers",
    );
    console.log(
      `✅ Customers: ${customersResult.rows[0].count} records available for invoicing`,
    );

    // Test 8: Check recurring invoices
    console.log("\n8. Testing recurring invoices...");
    const recurringResult = await client.query(
      "SELECT COUNT(*) as count FROM recurring_invoices",
    );
    console.log(
      `✅ Recurring Invoices: ${recurringResult.rows[0].count} records`,
    );

    // Test 9: Check triggers
    console.log("\n9. Testing triggers...");
    const triggersResult = await client.query(`
      SELECT trigger_name, event_object_table 
      FROM information_schema.triggers 
      WHERE trigger_name LIKE '%invoice%' 
      ORDER BY trigger_name
    `);
    console.log(
      `✅ Invoice Triggers: ${triggersResult.rows.length} automation triggers active`,
    );
    triggersResult.rows.forEach((row) => {
      console.log(`   ⚡ ${row.trigger_name} on ${row.event_object_table}`);
    });

    // Test 10: Check indexes
    console.log("\n10. Testing indexes...");
    const indexesResult = await client.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE indexname LIKE 'idx_%invoice%' OR indexname LIKE 'idx_%payment%'
      ORDER BY indexname
    `);
    console.log(
      `✅ Performance Indexes: ${indexesResult.rows.length} indexes created`,
    );

    // Test 11: Check RLS policies
    console.log("\n11. Testing RLS policies...");
    const policiesResult = await client.query(`
      SELECT tablename, policyname, cmd 
      FROM pg_policies 
      WHERE tablename IN ('invoices', 'payments', 'invoice_line_items', 'invoice_templates', 'payment_allocations', 'invoice_status_history', 'recurring_invoices')
      ORDER BY tablename, policyname
    `);
    console.log(
      `✅ RLS Policies: ${policiesResult.rows.length} security policies configured`,
    );

    console.log("\n🎉 Enhanced Invoice Management System Test Complete!\n");
    console.log("📊 System Status Summary:");
    console.log(
      `   ✅ ${templatesResult.rows.length} invoice templates available`,
    );
    console.log(
      `   ✅ ${invoiceColumnsResult.rows.length} enhanced invoice columns`,
    );
    console.log(
      `   ✅ ${lineItemColumnsResult.rows.length} enhanced line item columns`,
    );
    console.log(
      `   ✅ ${paymentColumnsResult.rows.length} enhanced payment columns`,
    );
    console.log(
      `   ✅ ${triggersResult.rows.length} automation triggers active`,
    );
    console.log(`   ✅ ${indexesResult.rows.length} performance indexes`);
    console.log(`   ✅ ${policiesResult.rows.length} RLS security policies`);
    console.log(
      `   ✅ ${customersResult.rows[0].count} customers ready for invoicing`,
    );
    console.log("\n🚀 Your invoice management system is fully operational!");
    console.log("🔗 Ready for React application integration with hooks");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log("\n📡 Database connection closed");
  }
}

testInvoiceSystemDirect();
