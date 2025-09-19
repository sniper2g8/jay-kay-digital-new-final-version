require('dotenv').config({ path: '.env.local' });
import { Client } from 'pg';;

async function checkJobsTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Get column information for jobs table
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'jobs'
      ORDER BY ordinal_position
    `);
    console.log('Jobs table columns:');
    columns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Get a few sample rows
    const res = await client.query('SELECT * FROM jobs LIMIT 3');
    console.log('\n\nSample jobs rows:');
    res.rows.forEach((row, index) => {
      console.log(`\nRow ${index + 1}:`);
      Object.entries(row).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          console.log(`  ${key}: ${JSON.stringify(value, null, 2)}`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      });
    });
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

checkJobsTable();