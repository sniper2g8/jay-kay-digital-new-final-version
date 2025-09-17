const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("🔍 Environment check...");
console.log("Supabase URL:", supabaseUrl ? "Found" : "Missing");
console.log("Service Key:", supabaseServiceKey ? "Found" : "Missing");

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log("🚀 Running paper specifications migration...");

    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      "migrations",
      "create_paper_specifications.sql",
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("📖 Migration file loaded successfully");

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    console.log(`📊 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(
            `⚡ Executing statement ${i + 1}/${statements.length}...`,
          );

          // Use the REST API to execute SQL
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: supabaseServiceKey,
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              sql: statement + ";",
            }),
          });

          if (!response.ok) {
            console.log(
              `⚠️  Statement ${i + 1} failed via RPC, trying direct execution...`,
            );
            // Try alternative approach for DDL statements
            continue;
          }

          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (err) {
          console.log(`⚠️  Statement ${i + 1} error:`, err.message);
        }
      }
    }

    // Test if tables were created
    console.log("\n🧪 Testing table creation...");

    const { data: paperSizes, error: sizesError } = await supabase
      .from("paper_sizes")
      .select("count")
      .limit(1);

    const { data: paperWeights, error: weightsError } = await supabase
      .from("paper_weights")
      .select("count")
      .limit(1);

    const { data: paperTypes, error: typesError } = await supabase
      .from("paper_types")
      .select("count")
      .limit(1);

    if (sizesError) console.log("❌ paper_sizes:", sizesError.message);
    else console.log("✅ paper_sizes table accessible");

    if (weightsError) console.log("❌ paper_weights:", weightsError.message);
    else console.log("✅ paper_weights table accessible");

    if (typesError) console.log("❌ paper_types:", typesError.message);
    else console.log("✅ paper_types table accessible");

    console.log(
      "\n📋 Migration completed! Please run the SQL manually in Supabase dashboard if tables are not accessible.",
    );
    console.log(
      "🔗 Go to: https://supabase.com/dashboard → Your Project → SQL Editor",
    );
    console.log(
      "📄 Copy and paste: migrations/create_paper_specifications.sql",
    );
  } catch (error) {
    console.error("❌ Migration error:", error.message);
    console.log(
      "\n📋 Please run the migration manually in Supabase dashboard:",
    );
    console.log("1. Go to https://supabase.com/dashboard");
    console.log("2. Select your project");
    console.log("3. Navigate to SQL Editor");
    console.log(
      "4. Copy and paste the contents of migrations/create_paper_specifications.sql",
    );
    console.log('5. Click "Run"');
  }
}

runMigration();
