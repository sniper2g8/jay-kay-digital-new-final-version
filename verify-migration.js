require('dotenv').config({ path: '.env.local' });
import { Client } from 'pg';;

async function verifyMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if the new columns exist in the jobs table
    const columns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'jobs' 
      AND column_name IN ('size_type', 'size_preset', 'custom_width', 'custom_height', 'size_unit', 'paper_type', 'paper_weight', 'finishing_options', 'special_instructions', 'requirements')
      ORDER BY column_name
    `);
    
    console.log('New specification columns in jobs table:');
    if (columns.rows.length === 0) {
      console.log('No specification columns found!');
    } else {
      columns.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type}`);
      });
    }
    
    // Check a few sample jobs with specification data
    console.log('\nSample jobs with specification data:');
    const sampleJobs = await client.query(`
      SELECT id, title, size_type, size_preset, custom_width, custom_height, size_unit, paper_type, paper_weight, finishing_options
      FROM jobs 
      WHERE size_type IS NOT NULL OR paper_type IS NOT NULL OR finishing_options IS NOT NULL
      LIMIT 5
    `);
    
    sampleJobs.rows.forEach((job, index) => {
      console.log(`\nJob ${index + 1}: ${job.title}`);
      console.log(`  ID: ${job.id}`);
      console.log(`  Size Type: ${job.size_type}`);
      console.log(`  Size Preset: ${job.size_preset}`);
      if (job.custom_width) {
        console.log(`  Custom Size: ${job.custom_width} x ${job.custom_height} ${job.size_unit}`);
      }
      console.log(`  Paper Type: ${job.paper_type}`);
      console.log(`  Paper Weight: ${job.paper_weight}`);
      if (job.finishing_options) {
        console.log(`  Finishing Options: ${JSON.stringify(job.finishing_options)}`);
      }
    });
    
    // Count total jobs with specifications
    const countResult = await client.query(`
      SELECT COUNT(*) as total,
             COUNT(CASE WHEN size_type IS NOT NULL THEN 1 END) as with_size,
             COUNT(CASE WHEN paper_type IS NOT NULL THEN 1 END) as with_paper,
             COUNT(CASE WHEN finishing_options IS NOT NULL THEN 1 END) as with_finishing
      FROM jobs
    `);
    
    const counts = countResult.rows[0];
    console.log(`\nSummary:`);
    console.log(`  Total jobs: ${counts.total}`);
    console.log(`  Jobs with size info: ${counts.with_size}`);
    console.log(`  Jobs with paper info: ${counts.with_paper}`);
    console.log(`  Jobs with finishing info: ${counts.with_finishing}`);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

verifyMigration();