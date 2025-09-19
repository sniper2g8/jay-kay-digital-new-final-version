require('dotenv').config({ path: '.env.local' });
import { Client } from 'pg';;

async function testJobByNumber() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Test with a known job number
    const jobNo = 'JKDP-JOB-0042';
    
    const result = await client.query(`
      SELECT id, "jobNo", title, size_type, paper_type, paper_weight
      FROM jobs 
      WHERE "jobNo" = $1
    `, [jobNo]);
    
    if (result.rows.length > 0) {
      const job = result.rows[0];
      console.log(`Found job:`);
      console.log(`  ID: ${job.id}`);
      console.log(`  Job No: ${job.jobNo}`);
      console.log(`  Title: ${job.title}`);
      console.log(`  Size Type: ${job.size_type}`);
      console.log(`  Paper Type: ${job.paper_type}`);
      console.log(`  Paper Weight: ${job.paper_weight}`);
    } else {
      console.log(`No job found with jobNo: ${jobNo}`);
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

testJobByNumber();