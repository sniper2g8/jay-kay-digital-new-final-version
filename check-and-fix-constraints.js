require('dotenv').config({ path: '.env.local' });
import { Client } from 'pg';;

async function checkAndFixConstraints() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if unique constraint exists on job_id
    const constraintCheck = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'job_specifications' 
      AND constraint_type = 'UNIQUE'
    `);
    
    console.log('Current unique constraints on job_specifications:');
    constraintCheck.rows.forEach(row => {
      console.log(`  ${row.constraint_name}`);
    });
    
    // Check if there's already a unique index on job_id
    const indexCheck = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'job_specifications' 
      AND indexdef LIKE '%job_id%'
    `);
    
    console.log('\nCurrent indexes on job_specifications:');
    indexCheck.rows.forEach(row => {
      console.log(`  ${row.indexname}`);
    });
    
    // If no unique constraint or index on job_id, add one
    if (indexCheck.rows.length === 0) {
      console.log('\nAdding unique constraint on job_id...');
      await client.query(`
        ALTER TABLE job_specifications 
        ADD CONSTRAINT job_specifications_job_id_unique UNIQUE (job_id)
      `);
      console.log('Unique constraint added successfully');
    } else {
      console.log('\nUnique constraint or index already exists on job_id');
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

checkAndFixConstraints();