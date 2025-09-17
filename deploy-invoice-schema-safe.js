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

async function deployInvoiceSchemaIncremental() {
  console.log(
    "🚀 Deploying Enhanced Invoice Management Schema (Incremental)...\n",
  );

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

    // Execute schema in smaller chunks to handle conflicts gracefully
    const sqlCommands = [
      // 1. Enhance existing invoices table
      {
        name: "Enhance invoices table",
        sql: `
        ALTER TABLE invoices 
        ADD COLUMN IF NOT EXISTS invoice_status VARCHAR(20) DEFAULT 'draft' CHECK (invoice_status IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled')),
        ADD COLUMN IF NOT EXISTS invoice_date DATE DEFAULT CURRENT_DATE,
        ADD COLUMN IF NOT EXISTS terms_days INTEGER DEFAULT 30,
        ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS late_fee_percentage DECIMAL(5,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS pdf_generated BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS pdf_url TEXT,
        ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS generated_by UUID REFERENCES "appUsers"(id),
        ADD COLUMN IF NOT EXISTS template_id UUID;
        `,
      },

      // 2. Enable RLS on invoice_line_items
      {
        name: "Enable RLS on invoice_line_items",
        sql: `ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;`,
      },

      // 3. Enhance invoice_line_items table
      {
        name: "Enhance invoice_line_items table",
        sql: `
        ALTER TABLE invoice_line_items 
        ADD COLUMN IF NOT EXISTS line_order INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id) ON DELETE SET NULL;
        `,
      },

      // 4. Enhance payments table
      {
        name: "Enhance payments table",
        sql: `
        ALTER TABLE payments 
        ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
        ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100),
        ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(50),
        ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id),
        ADD COLUMN IF NOT EXISTS applied_to_invoice_id UUID REFERENCES invoices(id),
        ADD COLUMN IF NOT EXISTS overpayment_amount DECIMAL(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS fees DECIMAL(10,2) DEFAULT 0;
        `,
      },

      // 5. Create invoice_templates table
      {
        name: "Create invoice_templates table",
        sql: `
        CREATE TABLE IF NOT EXISTS invoice_templates (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          template_name VARCHAR(100) NOT NULL,
          template_type VARCHAR(20) DEFAULT 'standard' CHECK (template_type IN ('standard', 'service', 'product', 'custom')),
          is_default BOOLEAN DEFAULT FALSE,
          header_html TEXT,
          footer_html TEXT,
          terms_conditions TEXT,
          payment_instructions TEXT,
          primary_color VARCHAR(7) DEFAULT '#000000',
          secondary_color VARCHAR(7) DEFAULT '#666666',
          logo_url TEXT,
          font_family VARCHAR(50) DEFAULT 'Arial',
          show_line_numbers BOOLEAN DEFAULT TRUE,
          show_tax_breakdown BOOLEAN DEFAULT TRUE,
          show_payment_terms BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          created_by UUID REFERENCES "appUsers"(id)
        );
        `,
      },

      // 6. Create payment_allocations table
      {
        name: "Create payment_allocations table",
        sql: `
        CREATE TABLE IF NOT EXISTS payment_allocations (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
          invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
          allocated_amount DECIMAL(10,2) NOT NULL,
          allocation_date TIMESTAMPTZ DEFAULT NOW(),
          allocation_type VARCHAR(20) DEFAULT 'payment' CHECK (allocation_type IN ('payment', 'credit', 'adjustment')),
          notes TEXT,
          created_by UUID REFERENCES "appUsers"(id),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        `,
      },

      // 7. Create invoice_status_history table
      {
        name: "Create invoice_status_history table",
        sql: `
        CREATE TABLE IF NOT EXISTS invoice_status_history (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
          status_from VARCHAR(20),
          status_to VARCHAR(20) NOT NULL,
          change_date TIMESTAMPTZ DEFAULT NOW(),
          changed_by UUID REFERENCES "appUsers"(id),
          reason TEXT,
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        `,
      },

      // 8. Create recurring_invoices table
      {
        name: "Create recurring_invoices table",
        sql: `
        CREATE TABLE IF NOT EXISTS recurring_invoices (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          template_invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
          customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
          frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
          interval_count INTEGER DEFAULT 1,
          start_date DATE NOT NULL,
          end_date DATE,
          next_generation_date DATE NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          total_generated INTEGER DEFAULT 0,
          max_occurrences INTEGER,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          created_by UUID REFERENCES "appUsers"(id)
        );
        `,
      },
    ];

    // Execute each command individually
    for (const command of sqlCommands) {
      try {
        console.log(`⚡ ${command.name}...`);
        await client.query(command.sql);
        console.log(`✅ ${command.name} - Success`);
      } catch (error) {
        if (
          error.message.includes("already exists") ||
          error.message.includes("duplicate column")
        ) {
          console.log(`⚠️  ${command.name} - Already exists (skipping)`);
        } else {
          console.error(`❌ ${command.name} - Error: ${error.message}`);
        }
      }
    }

    console.log("\n🔍 Creating indexes and policies...\n");

    // Create indexes (IF NOT EXISTS)
    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(invoice_status);",
      "CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);",
      "CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);",
      "CREATE INDEX IF NOT EXISTS idx_invoices_customer_status ON invoices(customer_id, invoice_status);",
      "CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);",
      "CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);",
      "CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(applied_to_invoice_id);",
      "CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);",
    ];

    for (const indexSql of indexes) {
      try {
        await client.query(indexSql);
      } catch (error) {
        if (!error.message.includes("already exists")) {
          console.log(`⚠️  Index creation warning: ${error.message}`);
        }
      }
    }

    // Insert default template (if not exists)
    try {
      console.log("📝 Creating default invoice template...");
      await client.query(`
        INSERT INTO invoice_templates (
          template_name,
          template_type,
          is_default,
          header_html,
          footer_html,
          terms_conditions,
          payment_instructions,
          primary_color,
          secondary_color
        ) VALUES (
          'Default Invoice Template',
          'standard',
          TRUE,
          '<div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #000000; margin: 0;">Jay Kay Digital Press</h1>
            <p style="color: #666666; margin: 5px 0;">Professional Printing Services</p>
          </div>',
          '<div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #666666; font-size: 12px;">Thank you for your business!</p>
            <p style="color: #666666; font-size: 12px;">Questions? Contact us at billing@jaykaydp.com</p>
          </div>',
          'Payment is due within 30 days of invoice date. Late payments may incur additional fees.',
          'Please remit payment via bank transfer, cash, or approved payment methods. Include invoice number with payment.',
          '#000000',
          '#666666'
        ) ON CONFLICT DO NOTHING;
      `);
      console.log("✅ Default template created");
    } catch (error) {
      console.log(`⚠️  Template creation: ${error.message}`);
    }

    // Verify deployment
    console.log("\n🔍 Verifying deployment...\n");

    const templatesResult = await client.query(
      "SELECT COUNT(*) as count FROM invoice_templates",
    );
    console.log(
      `📋 Invoice Templates: ${templatesResult.rows[0].count} records`,
    );

    const allocationsResult = await client.query(
      "SELECT COUNT(*) as count FROM payment_allocations",
    );
    console.log(
      `💰 Payment Allocations: ${allocationsResult.rows[0].count} records`,
    );

    const historyResult = await client.query(
      "SELECT COUNT(*) as count FROM invoice_status_history",
    );
    console.log(
      `📊 Invoice Status History: ${historyResult.rows[0].count} records`,
    );

    const recurringResult = await client.query(
      "SELECT COUNT(*) as count FROM recurring_invoices",
    );
    console.log(
      `🔄 Recurring Invoices: ${recurringResult.rows[0].count} records`,
    );

    console.log(
      "\n🎉 Enhanced Invoice Management Schema Deployment Complete!\n",
    );
    console.log("🚀 Your invoice management system is now ready!");
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log("\n📡 Database connection closed");
  }
}

deployInvoiceSchemaIncremental();
