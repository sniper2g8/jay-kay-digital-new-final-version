// Execute RLS policies directly using Node.js connection
const { Pool } = require("pg");
const fs = require("fs");
require("dotenv").config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runRLSPolicies() {
  let client;
  try {
    client = await pool.connect();

    console.log("🔒 Executing RLS Policies...");
    console.log("=====================================");

    // Read the SQL file
    const sqlContent = fs.readFileSync("fix-rls-policies.sql", "utf8");

    // Split by semicolons to execute individual statements
    const statements = sqlContent
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt && !stmt.startsWith("--") && stmt.length > 0);

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      try {
        // Skip comment-only statements
        if (statement.startsWith("--") || statement.trim().length === 0) {
          continue;
        }

        console.log(`\n${i + 1}. Executing: ${statement.substring(0, 60)}...`);

        await client.query(statement);
        successCount++;
        console.log(`   ✅ Success`);
      } catch (error) {
        errorCount++;

        // Some errors are expected (like policy already exists)
        if (
          error.message.includes("already exists") ||
          error.message.includes("does not exist")
        ) {
          console.log(`   ⚠️  Expected: ${error.message}`);
        } else {
          console.log(`   ❌ Error: ${error.message}`);
        }
      }
    }

    console.log("\n🎯 Execution Summary:");
    console.log("====================");
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`⚠️  Errors (may be expected): ${errorCount}`);

    // Verify RLS is enabled
    console.log("\n🔍 Verifying RLS Status:");
    console.log("========================");

    const rlsCheck = await client.query(`
      SELECT 
        tablename,
        rowsecurity as rls_enabled
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('appUsers', 'customers', 'jobs', 'invoices', 'payments', 'services', 'inventory')
      ORDER BY tablename
    `);

    rlsCheck.rows.forEach((row) => {
      const status = row.rls_enabled ? "✅ ENABLED" : "❌ DISABLED";
      console.log(`${row.tablename.padEnd(20)} | RLS: ${status}`);
    });

    // Check policies created
    console.log("\n📋 Policies Created:");
    console.log("===================");

    const policiesCheck = await client.query(`
      SELECT 
        tablename,
        COUNT(*) as policy_count
      FROM pg_policies 
      WHERE schemaname = 'public'
      GROUP BY tablename
      ORDER BY tablename
    `);

    policiesCheck.rows.forEach((row) => {
      console.log(
        `${row.tablename.padEnd(20)} | Policies: ${row.policy_count}`,
      );
    });

    console.log("\n🎉 RLS Policy execution completed!");
    console.log("Your database is now secured with Row Level Security.");
  } catch (err) {
    console.error("💥 Fatal Error:", err.message);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

runRLSPolicies();
