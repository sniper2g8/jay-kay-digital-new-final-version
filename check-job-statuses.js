const { Client } = require('pg');

async function checkJobStatuses() {
  const client = new Client({
    connectionString: 'postgresql://postgres.vkitlmjmtlktclcabjsg:Magics123@aws-0-eu-central-1.pooler.supabase.com:6543/postgres'
  });
  
  try {
    await client.connect();
    console.log('=== JOB STATUS VALUES ===');
    const result = await client.query('SELECT DISTINCT status, COUNT(*) as count FROM jobs GROUP BY status ORDER BY count DESC');
    result.rows.forEach(row => {
      console.log(`${row.status}: ${row.count} jobs`);
    });
    
    console.log('\n=== SAMPLE JOBS ===');
    const sampleJobs = await client.query(`
      SELECT id, "jobNo", title, status, "customerName", created_at 
      FROM jobs 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    sampleJobs.rows.forEach(job => {
      console.log(`${job.jobNo} | ${job.status} | ${job.customerName} | ${job.title}`);
    });

    console.log('\n=== ALL JOBS COUNT ===');
    const totalResult = await client.query('SELECT COUNT(*) as total FROM jobs');
    console.log(`Total jobs in database: ${totalResult.rows[0].total}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkJobStatuses();