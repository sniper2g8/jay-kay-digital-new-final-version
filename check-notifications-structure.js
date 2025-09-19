require("dotenv").config({ path: ".env.local" });
const { Client } = require("pg");

async function checkNotificationsStructure() {
  const client = new Client({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("✅ Connected to database");

    // Get notifications table structure
    const res = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'notifications' AND table_schema = 'public' 
      ORDER BY ordinal_position
    `);

    console.log("\nNotifications table structure:");
    console.log("================================");
    res.rows.forEach((row, index) => {
      console.log(
        `${index + 1}. ${row.column_name}: ${row.data_type} ${row.is_nullable === "YES" ? "(nullable)" : "(not null)"}`,
      );
    });
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await client.end();
  }
}

checkNotificationsStructure();
