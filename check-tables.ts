import { Client } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function checkTables() {
  try {
    await client.connect();

    // Check which invoice-related tables exist
    const { rows } = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name LIKE '%invoice%item%' 
      ORDER BY table_name, ordinal_position
    `);

    console.log("Invoice item tables found:");
    console.log(rows);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

checkTables();
