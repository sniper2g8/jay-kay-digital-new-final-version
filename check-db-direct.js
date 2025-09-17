const { Pool } = require("pg");

// Use the direct PostgreSQL connection from .env.local
const pool = new Pool({
  host: "aws-1-eu-west-2.pooler.supabase.com",
  port: 5432,
  database: "postgres",
  user: "postgres.pnoxqzlxfuvjvufdjuqh",
  password: "...()Admin@1",
  ssl: {
    rejectUnauthorized: false,
  },
});

async function checkWithDirectSQL() {
  console.log("🔍 Using direct PostgreSQL connection...");

  try {
    // Check roles table
    console.log("\n1. Checking roles table...");
    const rolesResult = await pool.query("SELECT * FROM roles ORDER BY id");
    console.log("✅ Roles table data:");
    console.log(JSON.stringify(rolesResult.rows, null, 2));
    console.log("Total roles:", rolesResult.rows.length);

    // Check appUsers table (note the double quotes for case-sensitive name)
    console.log("\n2. Checking appUsers table...");
    const appUsersResult = await pool.query(
      'SELECT * FROM "appUsers" ORDER BY created_at DESC LIMIT 10',
    );
    console.log("✅ AppUsers table data:");
    console.log(JSON.stringify(appUsersResult.rows, null, 2));
    console.log("Total users:", appUsersResult.rows.length);

    // Check customers count
    console.log("\n3. Checking customers count...");
    const customersCount = await pool.query("SELECT COUNT(*) FROM customers");
    console.log("Total customers:", customersCount.rows[0].count);

    // List all tables to see what we have
    console.log("\n4. Listing all tables...");
    const tablesQuery = `
      SELECT table_name, table_schema 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    const tablesResult = await pool.query(tablesQuery);
    console.log("Available tables:");
    tablesResult.rows.forEach((table) => {
      console.log(`  - ${table.table_name}`);
    });
  } catch (error) {
    console.error("❌ Database error:", error.message);
  } finally {
    await pool.end();
  }
}

checkWithDirectSQL();
