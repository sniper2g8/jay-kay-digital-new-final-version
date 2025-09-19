require('dotenv').config({ path: '.env.local' });
import { Client } from 'pg';;

async function checkBackupColumns() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Get column information for jobs_backup_data table
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'jobs_backup_data'
      ORDER BY ordinal_position
    `);
    console.log('jobs_backup_data table columns:');
    columns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

checkBackupColumns();