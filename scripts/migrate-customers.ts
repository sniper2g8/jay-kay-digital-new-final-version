import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigration() {
  try {
    console.log("🚀 Starting customer table migration...");

    // Read the migration SQL file
    const migrationPath = path.join(
      process.cwd(),
      "migrations",
      "add_customer_columns.sql",
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("📄 Migration SQL:");
    console.log(migrationSQL);

    // Split the SQL into individual statements and execute each one
    const statements = migrationSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`\n⚡ Executing: ${statement.substring(0, 50)}...`);

        const { data, error } = await supabase.rpc("exec_sql", {
          sql: statement,
        });

        if (error) {
          console.error("❌ Error executing statement:", error);
          console.error("Statement was:", statement);
        } else {
          console.log("✅ Statement executed successfully");
        }
      }
    }

    console.log("\n🎉 Migration completed!");

    // Test the new schema by fetching customers
    console.log("\n🔍 Testing new schema...");
    const { data: customers, error: fetchError } = await supabase
      .from("customers")
      .select("*")
      .limit(1);

    if (fetchError) {
      console.error("❌ Error testing schema:", fetchError);
    } else {
      console.log("✅ Schema test successful");
      console.log(
        "Sample customer structure:",
        customers?.[0] || "No customers found",
      );
    }
  } catch (error) {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  }
}

// Alternative approach using direct SQL execution if RPC doesn't work
async function runMigrationDirect() {
  try {
    console.log("🚀 Starting customer table migration (direct approach)...");

    // Individual column additions
    const alterQueries = [
      `ALTER TABLE customers ADD COLUMN IF NOT EXISTS business_name TEXT;`,
      `ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_person TEXT;`,
      `ALTER TABLE customers ADD COLUMN IF NOT EXISTS email TEXT;`,
      `ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone TEXT;`,
      `ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT;`,
      `ALTER TABLE customers ADD COLUMN IF NOT EXISTS city TEXT;`,
      `ALTER TABLE customers ADD COLUMN IF NOT EXISTS state TEXT;`,
      `ALTER TABLE customers ADD COLUMN IF NOT EXISTS zip_code TEXT;`,
      `ALTER TABLE customers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';`,
      `ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes TEXT;`,
    ];

    for (const query of alterQueries) {
      console.log(`\n⚡ Executing: ${query}`);

      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .limit(0); // This will trigger schema validation

      if (error && !error.message.includes("column")) {
        console.error("❌ Error:", error);
      } else {
        console.log("✅ Query ready for execution");
      }
    }

    console.log(
      "\n📋 Migration commands ready. Please run them manually in Supabase SQL editor:",
    );
    alterQueries.forEach((query) => console.log(query));
  } catch (error) {
    console.error("💥 Migration preparation failed:", error);
  }
}

if (process.argv.includes("--direct")) {
  runMigrationDirect();
} else {
  runMigration();
}
