import { Client } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function checkStatementTables() {
  try {
    await client.connect();

    // Check if customer_statement_periods table exists
    const { rows } = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name LIKE '%statement%'
      ORDER BY table_name, ordinal_position
    `);

    if (rows.length === 0) {
      console.log("No statement tables found");
    } else {
      console.log("Statement tables found:");
      console.log(rows);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

checkStatementTables();
