const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function analyzeJobsTable() {
  console.log('🔍 Analyzing jobs table structure...');
  
  try {
    await client.connect();
    
    // Get table structure
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'jobs' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Current jobs table columns:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    // Check estimate field samples
    const sampleResult = await client.query(`
      SELECT id, "jobNo", estimated_cost, final_cost, estimate
      FROM jobs 
      WHERE estimate IS NOT NULL
      LIMIT 3
    `);
    
    console.log('\n📊 Sample estimate data:');
    sampleResult.rows.forEach(row => {
      console.log(`Job ${row.jobNo}:`);
      console.log(`  estimated_cost: ${row.estimated_cost}`);
      console.log(`  final_cost: ${row.final_cost}`);
      console.log(`  estimate: ${typeof row.estimate === 'object' ? JSON.stringify(row.estimate) : row.estimate}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

analyzeJobsTable();