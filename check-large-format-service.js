require("dotenv").config({ path: ".env.local" });
const { Client } = require("pg");

async function checkLargeFormatService() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("Connected to database");

    // Get the Large Format Printing service
    const result = await client.query(`
      SELECT id, title, description, options
      FROM services
      WHERE title = 'Large Format Printing'
    `);

    if (result.rows.length > 0) {
      const service = result.rows[0];
      console.log("Large Format Printing Service:");
      console.log(`ID: ${service.id}`);
      console.log(`Title: ${service.title}`);
      console.log(`Description: ${service.description}`);
      if (service.options) {
        console.log(`Options: ${JSON.stringify(service.options, null, 2)}`);
      }
    } else {
      console.log("Large Format Printing service not found");
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

checkLargeFormatService();
