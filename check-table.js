require('dotenv').config({ path: '.env.local' });
import { Client } from 'pg';;

async function checkTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const res = await client.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'job_specifications')");
    console.log('Table exists:', res.rows[0].exists);
    
    if (res.rows[0].exists) {
      const columns = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'job_specifications'");
      console.log('Columns:', columns.rows.map(r => r.column_name));
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

checkTable();