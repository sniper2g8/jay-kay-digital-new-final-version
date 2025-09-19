require('dotenv').config({ path: '.env.local' });
import { Client } from 'pg';;

async function getSampleJobId() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Get a sample job ID that has specification data
    const result = await client.query(`
      SELECT id, title
      FROM jobs 
      WHERE size_type IS NOT NULL OR paper_type IS NOT NULL OR finishing_options IS NOT NULL
      LIMIT 1
    `);
    
    if (result.rows.length > 0) {
      const job = result.rows[0];
      console.log(`Sample job with specifications:`);
      console.log(`  ID: ${job.id}`);
      console.log(`  Title: ${job.title}`);
      console.log(`\nYou can view this job at: http://localhost:3003/dashboard/jobs/${job.id}`);
    } else {
      console.log('No jobs with specifications found');
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

getSampleJobId();