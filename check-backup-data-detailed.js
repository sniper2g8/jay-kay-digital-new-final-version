require('dotenv').config({ path: '.env.local' });
import { Client } from 'pg';;

async function checkBackupData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Get a few rows from jobs_backup_data
    const res = await client.query('SELECT * FROM jobs_backup_data LIMIT 5');
    console.log('Sample jobs_backup_data rows:');
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
    
    // Get column information
    const columns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'jobs_backup_data'
      ORDER BY ordinal_position
    `);
    console.log('\n\nColumn information:');
    columns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

checkBackupData();