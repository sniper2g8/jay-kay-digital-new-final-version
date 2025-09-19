require('dotenv').config({ path: '.env.local' });
import { Client } from 'pg';;
import fs from 'fs';;

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read the migration file
    const migration = fs.readFileSync('migrations/create_job_specifications_table.sql', 'utf8');
    console.log('Migration file loaded');

    // Execute the entire migration as one statement
    await client.query(migration);
    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await client.end();
  }
}

runMigration();