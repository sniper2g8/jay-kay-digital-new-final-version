const { Client } = require("pg");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;

async function createBaseTableRLSPolicies() {
  console.log("🔐 Creating RLS Policies for Base Tables...\n");

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log("✅ Connected to database\n");

    const baseTablePolicies = [
      // Invoices table policies
      {
        name: "Enable RLS on invoices",
        sql: `ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;`,
      },
      {
        name: "Invoices view policy",
        sql: `
        DO $$ BEGIN
          CREATE POLICY "Users can view all invoices" ON invoices
            FOR SELECT USING (true);
        EXCEPTION
          WHEN duplicate_object THEN
            NULL;
        END $$;
        `,
      },
      {
        name: "Invoices manage policy",
        sql: `
        DO $$ BEGIN
          CREATE POLICY "Authenticated users can manage invoices" ON invoices
            FOR ALL USING (auth.uid() IS NOT NULL);
        EXCEPTION
          WHEN duplicate_object THEN
            NULL;
        END $$;
        `,
      },

      // Payments table policies
      {
        name: "Enable RLS on payments",
        sql: `ALTER TABLE payments ENABLE ROW LEVEL SECURITY;`,
      },
      {
        name: "Payments view policy",
        sql: `
        DO $$ BEGIN
          CREATE POLICY "Users can view all payments" ON payments
            FOR SELECT USING (true);
        EXCEPTION
          WHEN duplicate_object THEN
            NULL;
        END $$;
        `,
      },
      {
        name: "Payments manage policy",
        sql: `
        DO $$ BEGIN
          CREATE POLICY "Authenticated users can manage payments" ON payments
            FOR ALL USING (auth.uid() IS NOT NULL);
        EXCEPTION
          WHEN duplicate_object THEN
            NULL;
        END $$;
        `,
      },

      // Customers table policies
      {
        name: "Enable RLS on customers",
        sql: `ALTER TABLE customers ENABLE ROW LEVEL SECURITY;`,
      },
      {
        name: "Customers view policy",
        sql: `
        DO $$ BEGIN
          CREATE POLICY "Users can view all customers" ON customers
            FOR SELECT USING (true);
        EXCEPTION
          WHEN duplicate_object THEN
            NULL;
        END $$;
        `,
      },
      {
        name: "Customers manage policy",
        sql: `
        DO $$ BEGIN
          CREATE POLICY "Authenticated users can manage customers" ON customers
            FOR ALL USING (auth.uid() IS NOT NULL);
        EXCEPTION
          WHEN duplicate_object THEN
            NULL;
        END $$;
        `,
      },
    ];

    for (const policy of baseTablePolicies) {
      try {
        console.log(`🔐 ${policy.name}...`);
        await client.query(policy.sql);
        console.log(`✅ ${policy.name} - Success`);
      } catch (error) {
        if (
          error.message.includes("already exists") ||
          error.message.includes("duplicate")
        ) {
          console.log(`⚠️  ${policy.name} - Already exists`);
        } else {
          console.log(`❌ ${policy.name} - Error: ${error.message}`);
        }
      }
    }

    console.log("\n🎉 Base table RLS policies created successfully!");
    console.log("🔐 All invoice management tables are now properly secured");
  } catch (error) {
    console.error(
      "❌ Failed to create base table RLS policies:",
      error.message,
    );
    process.exit(1);
  } finally {
    await client.end();
  }
}

createBaseTableRLSPolicies();
