require('dotenv').config({ path: '.env.local' });
import { Client } from 'pg';;

async function checkJobs() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Get column names for jobs table
    const columns = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'jobs'");
    console.log('Jobs table columns:');
    columns.rows.forEach(col => {
      console.log(`  ${col.column_name}`);
    });

    // Get a few jobs
    const res = await client.query('SELECT id, "jobNo", title FROM jobs LIMIT 5');
    console.log('\nSample jobs:');
    res.rows.forEach(job => {
      console.log(`  ${job.id} - ${job.jobNo} - ${job.title}`);
    });
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

checkJobs();