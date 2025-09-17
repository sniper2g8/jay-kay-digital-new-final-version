const { Pool } = require("pg");

const pool = new Pool({
  host: "aws-1-eu-west-2.pooler.supabase.com",
  port: 5432,
  database: "postgres",
  user: "postgres.pnoxqzlxfuvjvufdjuqh",
  password: "...()Admin@1",
  ssl: { rejectUnauthorized: false },
});

async function checkTableStructure() {
  try {
    console.log("📋 Checking jobs table structure...");
    const jobsStructure = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'jobs' 
      ORDER BY ordinal_position
    `);

    console.log("Jobs table columns:");
    jobsStructure.rows.forEach((col) => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    console.log("\n📋 Checking invoices table structure...");
    const invoicesStructure = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' 
      ORDER BY ordinal_position
    `);

    console.log("Invoices table columns:");
    invoicesStructure.rows.forEach((col) => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    // Check sample data to understand relationships
    console.log("\n📊 Sample jobs data...");
    const sampleJobs = await pool.query("SELECT * FROM jobs LIMIT 2");
    console.log("Sample jobs:", JSON.stringify(sampleJobs.rows, null, 2));
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
  }
}

checkTableStructure();
