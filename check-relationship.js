require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function checkRelationship() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if the IDs match between jobs and jobs_backup_data
    const res = await client.query(`
      SELECT 
        j.id as job_id,
        j."jobNo" as job_number,
        j.title as job_title,
        b.id as backup_id,
        b.specifications as specifications
      FROM jobs j
      LEFT JOIN jobs_backup_data b ON j.id = b.id
      LIMIT 5
    `);
    
    console.log('Job and backup data relationship:');
    res.rows.forEach((row, index) => {
      console.log(`\nRow ${index + 1}:`);
      console.log(`  Job ID: ${row.job_id}`);
      console.log(`  Job Number: ${row.job_number}`);
      console.log(`  Job Title: ${row.job_title}`);
      console.log(`  Backup ID: ${row.backup_id}`);
      console.log(`  Has Specifications: ${!!row.specifications}`);
      if (row.specifications) {
        console.log(`  Specifications: ${JSON.stringify(row.specifications, null, 2)}`);
      }
    });
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

checkRelationship();