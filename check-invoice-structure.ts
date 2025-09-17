import { Client } from "pg";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function checkInvoiceStructure(): Promise<void> {
  try {
    await client.connect();
    console.log("✅ Connected to database");

    // Check invoices table structure
    console.log("\n📊 Invoices table structure:");
    const invoiceStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'invoices' 
      ORDER BY ordinal_position
    `);

    console.log("Columns in invoices table:");
    invoiceStructure.rows.forEach((col) => {
      console.log(
        `  ${col.column_name}: ${col.data_type} ${col.is_nullable === "NO" ? "NOT NULL" : ""}`,
      );
    });

    // Show sample invoice data
    console.log("\n📋 Sample invoice data:");
    const sampleInvoices = await client.query(`
      SELECT * FROM invoices LIMIT 3
    `);

    console.log(`Found ${sampleInvoices.rows.length} invoices:`);
    sampleInvoices.rows.forEach((invoice) => {
      console.log("\nInvoice data:");
      Object.keys(invoice).forEach((key) => {
        if (key === "items" && invoice[key]) {
          console.log(`  ${key}: ${JSON.stringify(invoice[key], null, 2)}`);
        } else {
          console.log(`  ${key}: ${invoice[key]}`);
        }
      });
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.end();
    console.log("\n🔌 Database connection closed");
  }
}

checkInvoiceStructure();
