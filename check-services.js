require("dotenv").config({ path: ".env.local" });
import { Client } from 'pg';;

async function checkServices() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("Connected to database");

    // Get all services
    const result = await client.query(`
      SELECT id, title, description, options
      FROM services
      ORDER BY title
    `);

    console.log("Services in the database:");
    result.rows.forEach((service, index) => {
      console.log(`\n${index + 1}. ${service.title} (${service.id})`);
      console.log(`   Description: ${service.description}`);
      if (service.options) {
        console.log(`   Options: ${JSON.stringify(service.options, null, 2)}`);
      }
    });
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

checkServices();
