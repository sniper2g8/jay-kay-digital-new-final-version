require('dotenv').config({ path: '.env.local' });
import { Client } from 'pg';;

// Get database connection details from environment
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function checkDatabaseStructure() {
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Check for finish_options table
    console.log('\n1. Checking finish_options table...');
    try {
      const finishResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'finish_options'
      `);
      
      if (finishResult.rows.length > 0) {
        console.log('✅ finish_options table exists');
        
        // Get sample data
        const sampleResult = await client.query(`
          SELECT id, name, category FROM finish_options LIMIT 5
        `);
        console.log('📋 Sample finish options:', sampleResult.rows);
      } else {
        console.log('❌ finish_options table does not exist');
      }
    } catch (err) {
      console.log('❌ Error checking finish_options:', err.message);
    }
    
    // Check for job specifications tables
    console.log('\n2. Checking for job specifications tables...');
    const specTableNames = ['job_specifications', 'job_specs', 'specifications', 'job_details'];
    
    for (const tableName of specTableNames) {
      try {
        const result = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_name = $1
        `, [tableName]);
        
        if (result.rows.length > 0) {
          console.log(`✅ ${tableName} table exists`);
          
          // Get column info
          const columnsResult = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = $1
            ORDER BY ordinal_position
          `, [tableName]);
          
          console.log(`📋 Columns in ${tableName}:`);
          columnsResult.rows.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type})`);
          });
        } else {
          console.log(`❌ ${tableName} table does not exist`);
        }
      } catch (err) {
        console.log(`❌ Error checking ${tableName}:`, err.message);
      }
    }
    
    // Check jobs table structure
    console.log('\n3. Checking jobs table structure...');
    try {
      const columnsResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'jobs'
        ORDER BY ordinal_position
      `);
      
      console.log('📋 Jobs table columns:');
      columnsResult.rows.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
      
      // Check for JSON columns
      const jsonColumns = columnsResult.rows.filter(col => 
        col.data_type.includes('json') || col.data_type.includes('JSON')
      );
      
      if (jsonColumns.length > 0) {
        console.log('📋 JSON columns in jobs table:');
        jsonColumns.forEach(col => {
          console.log(`  - ${col.column_name} (${col.data_type})`);
        });
      } else {
        console.log('📭 No JSON columns found in jobs table');
      }
    } catch (err) {
      console.log('❌ Error checking jobs table:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await client.end();
  }
}

checkDatabaseStructure().catch(console.error);