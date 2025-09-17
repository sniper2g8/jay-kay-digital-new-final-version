const { Client } = require("pg");

const client = new Client({
  connectionString:
    "postgresql://postgres.pnoxqzlxfuvjvufdjuqh:delsenterprise123@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
});

async function checkTableNames() {
  try {
    await client.connect();
    console.log("🔍 Checking Actual Table Names\n");

    // Check what tables exist in public schema
    console.log("=== Tables in public schema ===");
    const tablesQuery = `
      SELECT table_name, 
             table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    const tablesResult = await client.query(tablesQuery);
    console.log("Found tables:");
    tablesResult.rows.forEach((table) => {
      console.log(`- ${table.table_name} (${table.table_type})`);
    });

    // Check specifically for user-related tables
    console.log("\n=== User-related tables ===");
    const userTablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND LOWER(table_name) LIKE '%user%'
      ORDER BY table_name;
    `;

    const userTablesResult = await client.query(userTablesQuery);
    if (userTablesResult.rows.length === 0) {
      console.log("❌ No user-related tables found!");
      console.log("This might be why authentication is failing.");
    } else {
      console.log("User-related tables:");
      userTablesResult.rows.forEach((table) => {
        console.log(`- ${table.table_name}`);
      });
    }

    // Check RLS status on existing tables
    console.log("\n=== RLS Status ===");
    const rlsQuery = `
      SELECT t.table_name, 
             CASE WHEN c.relrowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
      FROM information_schema.tables t
      JOIN pg_class c ON c.relname = t.table_name
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE t.table_schema = 'public' 
      AND n.nspname = 'public'
      AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name;
    `;

    const rlsResult = await client.query(rlsQuery);
    rlsResult.rows.forEach((table) => {
      console.log(`- ${table.table_name}: RLS ${table.rls_status}`);
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.end();
  }
}

checkTableNames();
