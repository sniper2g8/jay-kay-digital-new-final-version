require('dotenv').config({ path: '.env.local' });
import { Client } from 'pg';;
import { v4: uuidv4 } from 'uuid';;

async function testJobSpecs() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Use an existing job ID from the previous output
    const jobId = '423cac46-461a-4563-b9ed-2903b4d73056';
    
    const insertResult = await client.query(
      `INSERT INTO job_specifications 
       (id, job_id, size_type, size_preset, paper_type, paper_weight, finishing_options)
       VALUES 
       ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (job_id) DO UPDATE SET
       size_type = $3, size_preset = $4, paper_type = $5, paper_weight = $6, finishing_options = $7
       RETURNING *`,
      [
        uuidv4(),
        jobId,
        'standard',
        'A4',
        'Glossy Paper',
        120,
        JSON.stringify({ selected_options: ['lamination', 'folding'] })
      ]
    );
    
    console.log('Inserted/Updated job specification:', insertResult.rows[0]);

    // Retrieve the job specification
    const selectResult = await client.query(
      'SELECT * FROM job_specifications WHERE job_id = $1',
      [jobId]
    );
    
    console.log('Retrieved job specification:', selectResult.rows[0]);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

testJobSpecs();