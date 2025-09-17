const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in environment variables");
  process.exit(1);
}

async function deployInvoiceSchema() {
  console.log("🚀 Deploying Enhanced Invoice Management Schema...\n");

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    // Connect to database
    console.log("📡 Connecting to database...");
    await client.connect();
    console.log("✅ Connected to Supabase PostgreSQL database\n");

    // Read the SQL schema file
    const schemaPath = path.join(
      __dirname,
      "migrations",
      "invoice_management_enhanced_fixed.sql",
    );
    console.log("📖 Reading schema file:", schemaPath);

    const schemaSql = fs.readFileSync(schemaPath, "utf8");
    console.log(`📄 Schema file loaded (${schemaSql.length} characters)\n`);

    // Execute the schema
    console.log("⚡ Executing Enhanced Invoice Management Schema...");
    console.log("This may take a few moments...\n");

    await client.query(schemaSql);

    console.log("✅ Schema deployed successfully!\n");

    // Verify deployment by checking new tables
    console.log("🔍 Verifying deployment...\n");

    // Check invoice_templates table
    const templatesResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM invoice_templates
    `);
    console.log(
      `📋 Invoice Templates: ${templatesResult.rows[0].count} records`,
    );

    // Check payment_allocations table
    const allocationsResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM payment_allocations
    `);
    console.log(
      `💰 Payment Allocations: ${allocationsResult.rows[0].count} records`,
    );

    // Check invoice_status_history table
    const historyResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM invoice_status_history
    `);
    console.log(
      `📊 Invoice Status History: ${historyResult.rows[0].count} records`,
    );

    // Check recurring_invoices table
    const recurringResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM recurring_invoices
    `);
    console.log(
      `🔄 Recurring Invoices: ${recurringResult.rows[0].count} records`,
    );

    // Check enhanced invoices table columns
    const invoiceColumnsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' 
        AND column_name IN ('invoice_status', 'invoice_date', 'terms_days', 'template_id')
      ORDER BY column_name
    `);
    console.log(
      `📝 Enhanced Invoice Columns: ${invoiceColumnsResult.rows.map((r) => r.column_name).join(", ")}`,
    );

    // Check enhanced invoice_line_items columns
    const lineItemColumnsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invoice_line_items' 
        AND column_name IN ('line_order', 'discount_amount', 'tax_rate', 'tax_amount', 'job_id')
      ORDER BY column_name
    `);
    console.log(
      `📋 Enhanced Line Item Columns: ${lineItemColumnsResult.rows.map((r) => r.column_name).join(", ")}`,
    );

    // Check enhanced payments columns
    const paymentColumnsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
        AND column_name IN ('payment_status', 'customer_id', 'applied_to_invoice_id')
      ORDER BY column_name
    `);
    console.log(
      `💳 Enhanced Payment Columns: ${paymentColumnsResult.rows.map((r) => r.column_name).join(", ")}`,
    );

    // Check triggers
    const triggersResult = await client.query(`
      SELECT trigger_name, event_object_table 
      FROM information_schema.triggers 
      WHERE trigger_name LIKE '%invoice%' 
      ORDER BY trigger_name
    `);
    console.log(
      `⚡ Invoice Triggers: ${triggersResult.rows.length} triggers created`,
    );

    // Check indexes
    const indexesResult = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE indexname LIKE 'idx_%invoice%' OR indexname LIKE 'idx_%payment%'
      ORDER BY indexname
    `);
    console.log(
      `🚀 Performance Indexes: ${indexesResult.rows.length} indexes created`,
    );

    console.log(
      "\n🎉 Enhanced Invoice Management Schema Deployment Complete!\n",
    );
    console.log("📊 Summary:");
    console.log(
      "   ✅ Enhanced existing tables: invoices, payments, invoice_line_items",
    );
    console.log(
      "   ✅ New tables created: 4 (templates, allocations, history, recurring)",
    );
    console.log("   ✅ Triggers created for automation and audit trails");
    console.log("   ✅ Indexes created for performance optimization");
    console.log("   ✅ RLS policies configured for security");
    console.log("   ✅ Customer statements integration active");
    console.log("\n🚀 Ready for invoice management implementation!");
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);

    if (error.message.includes("permission denied")) {
      console.error("\n💡 Permission Issue:");
      console.error(
        "   - Make sure you are using the SERVICE_ROLE_KEY, not ANON_KEY",
      );
      console.error("   - Check that RLS policies allow the operation");
      console.error("   - Verify database connection string is correct");
    }

    if (error.message.includes("does not exist")) {
      console.error("\n💡 Missing Dependencies:");
      console.error(
        "   - Ensure customer_statements_production.sql was executed first",
      );
      console.error(
        "   - Check that required tables (customers, jobs, appUsers) exist",
      );
    }

    process.exit(1);
  } finally {
    await client.end();
    console.log("\n📡 Database connection closed");
  }
}

deployInvoiceSchema();
