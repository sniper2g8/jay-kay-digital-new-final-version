import { Client } from 'pg';;
require("dotenv").config({ path: ".env.local" });

async function checkTables() {
  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // Check services table
    const services = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'services' AND table_schema = 'public' 
      ORDER BY ordinal_position
    `);
    console.log("Services table:");
    services.rows.forEach((r) =>
      console.log(`  ${r.column_name}: ${r.data_type}`),
    );

    // Check file_attachments table
    const fileAttachments = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'file_attachments' AND table_schema = 'public' 
      ORDER BY ordinal_position
    `);
    console.log("\nFile_attachments table:");
    fileAttachments.rows.forEach((r) =>
      console.log(`  ${r.column_name}: ${r.data_type}`),
    );
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await client.end();
  }
}

checkTables();
