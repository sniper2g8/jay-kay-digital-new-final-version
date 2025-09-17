const { Pool } = require("pg");
require("dotenv").config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function fixTableConsistency() {
  let client;
  try {
    client = await pool.connect();

    console.log("🔍 Checking for table name variations...");

    // Check what tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name ILIKE '%appuser%' OR table_name IN ('customers', 'profiles'))
      ORDER BY table_name
    `);

    console.log("📋 Found tables:");
    tablesResult.rows.forEach((row) => {
      console.log(`  - ${row.table_name}`);
    });

    // Check if both appusers and appUsers exist
    const hasLowerCase = tablesResult.rows.some(
      (row) => row.table_name === "appusers",
    );
    const hasPascalCase = tablesResult.rows.some(
      (row) => row.table_name === "appUsers",
    );

    if (hasLowerCase && hasPascalCase) {
      console.log(
        '\n⚠️  CONFLICT: Both "appusers" and "appUsers" tables exist!',
      );

      // Check data in both tables
      console.log("\n📊 Checking data in both tables...");

      const lowerCaseData = await client.query(
        "SELECT COUNT(*) as count FROM appusers",
      );
      const pascalCaseData = await client.query(
        'SELECT COUNT(*) as count FROM "appUsers"',
      );

      console.log(`  - appusers: ${lowerCaseData.rows[0].count} records`);
      console.log(`  - appUsers: ${pascalCaseData.rows[0].count} records`);

      // Show sample data from both
      console.log("\n📝 Sample data from appusers:");
      const lowerSample = await client.query(
        "SELECT id, name, email, primary_role FROM appusers LIMIT 3",
      );
      lowerSample.rows.forEach((row) => {
        console.log(`  - ${row.name} (${row.email}) - ${row.primary_role}`);
      });

      console.log("\n📝 Sample data from appUsers:");
      const pascalSample = await client.query(
        'SELECT id, name, email, primary_role FROM "appUsers" LIMIT 3',
      );
      pascalSample.rows.forEach((row) => {
        console.log(`  - ${row.name} (${row.email}) - ${row.primary_role}`);
      });

      // Check for duplicates by email
      console.log("\n🔄 Checking for duplicate emails between tables...");
      const duplicatesResult = await client.query(`
        SELECT a1.email, a1.name as appusers_name, a2.name as appUsers_name
        FROM appusers a1
        INNER JOIN "appUsers" a2 ON a1.email = a2.email
      `);

      if (duplicatesResult.rows.length > 0) {
        console.log("⚠️  Found duplicate emails:");
        duplicatesResult.rows.forEach((row) => {
          console.log(
            `  - ${row.email}: "${row.appusers_name}" vs "${row.appusers_name}"`,
          );
        });
      } else {
        console.log("✅ No duplicate emails found between tables");
      }

      console.log("\n🔧 RECOMMENDATION:");
      console.log('1. Keep "appUsers" (Pascal case) as the main table');
      console.log('2. Migrate any unique data from "appusers" to "appUsers"');
      console.log('3. Drop the "appusers" table');
      console.log('4. Update all references to use "appUsers"');
    } else if (hasLowerCase) {
      console.log('\n✅ Only "appusers" exists - should rename to "appUsers"');
    } else if (hasPascalCase) {
      console.log('\n✅ Only "appUsers" exists - table naming is correct');
    } else {
      console.log("\n❌ No appUsers table found!");
    }
  } catch (err) {
    console.error("💥 Error:", err.message);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

fixTableConsistency();
