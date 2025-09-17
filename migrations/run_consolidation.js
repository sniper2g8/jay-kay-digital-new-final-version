const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log("🚀 Starting customer consolidation migration...");

    // Read the migration SQL file
    const migrationPath = path.join(
      __dirname,
      "final_customer_consolidation.sql",
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    // Remove comments and split into individual statements
    const statements = migrationSQL
      .split("\n")
      .filter((line) => !line.trim().startsWith("--") && line.trim())
      .join("\n")
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt && stmt !== "BEGIN" && stmt !== "COMMIT");

    console.log(`📋 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      console.log(`   ${statement.substring(0, 60)}...`);

      const { error } = await supabase.rpc("exec_sql", {
        sql_query: statement,
      });

      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error);
        throw error;
      }
    }

    console.log("✅ Migration completed successfully!");
    console.log(
      "🔄 Remember to regenerate TypeScript types with: npx supabase gen types typescript --project-id your-project-id > src/lib/database-generated.types.ts",
    );
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
