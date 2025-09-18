require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function checkBackupTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if jobs_backup_data table exists
    const exists = await client.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'jobs_backup_data')");
    console.log('jobs_backup_data table exists:', exists.rows[0].exists);
    
    if (exists.rows[0].exists) {
      // Get column names for jobs_backup_data table
      const columns = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'jobs_backup_data'");
      console.log('jobs_backup_data columns:');
      columns.rows.forEach(col => {
        console.log(`  ${col.column_name}`);
      });
    } else {
      console.log('jobs_backup_data table does not exist');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

checkBackupTable();