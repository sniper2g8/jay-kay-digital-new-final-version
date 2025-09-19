require('dotenv').config({ path: '.env.local' });
import { Client } from 'pg';;

const dbConfig = {
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: { rejectUnauthorized: false }
};

async function checkActualTableNames() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL directly');

    // Query 1: Get all table names in the public schema
    console.log('\n=== ALL TABLES IN PUBLIC SCHEMA ===');
    const tablesQuery = `
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    console.log(`Found ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.table_name} (${row.table_type})`);
    });

    // Query 2: Look specifically for finish/finishing related tables
    console.log('\n=== FINISH/FINISHING RELATED TABLES ===');
    const finishTablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%finish%' OR table_name LIKE '%option%')
      ORDER BY table_name;
    `;
    
    const finishResult = await client.query(finishTablesQuery);
    if (finishResult.rows.length > 0) {
      console.log('Found finish/option related tables:');
      finishResult.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.table_name}`);
      });
    } else {
      console.log('No finish/option related tables found');
    }

    // Query 3: Check jobs table structure
    console.log('\n=== JOBS TABLE STRUCTURE ===');
    const jobsColumnsQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'jobs'
      ORDER BY ordinal_position;
    `;
    
    const jobsResult = await client.query(jobsColumnsQuery);
    if (jobsResult.rows.length > 0) {
      console.log('Jobs table columns:');
      jobsResult.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    } else {
      console.log('Jobs table not found or not accessible');
    }

    // Query 4: Check services table structure
    console.log('\n=== SERVICES TABLE STRUCTURE ===');
    const servicesColumnsQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'services'
      ORDER BY ordinal_position;
    `;
    
    const servicesResult = await client.query(servicesColumnsQuery);
    if (servicesResult.rows.length > 0) {
      console.log('Services table columns:');
      servicesResult.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    } else {
      console.log('Services table not found or not accessible');
    }

    // Query 5: Check for any table with 'finish' in column names
    console.log('\n=== TABLES WITH FINISH-RELATED COLUMNS ===');
    const finishColumnsQuery = `
      SELECT table_name, column_name, data_type
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND (column_name LIKE '%finish%' OR column_name LIKE '%option%')
      ORDER BY table_name, column_name;
    `;
    
    const finishColumnsResult = await client.query(finishColumnsQuery);
    if (finishColumnsResult.rows.length > 0) {
      console.log('Found finish-related columns:');
      finishColumnsResult.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.table_name}.${row.column_name} (${row.data_type})`);
      });
    } else {
      console.log('No finish-related columns found');
    }

    // Query 6: Check foreign key relationships
    console.log('\n=== FOREIGN KEY RELATIONSHIPS ===');
    const fkQuery = `
      SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_schema = 'public'
      AND (tc.table_name = 'jobs' OR ccu.table_name = 'jobs' OR 
           tc.table_name LIKE '%finish%' OR ccu.table_name LIKE '%finish%' OR
           tc.table_name LIKE '%option%' OR ccu.table_name LIKE '%option%')
      ORDER BY tc.table_name, kcu.column_name;
    `;
    
    const fkResult = await client.query(fkQuery);
    if (fkResult.rows.length > 0) {
      console.log('Found relevant foreign key relationships:');
      fkResult.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`);
      });
    } else {
      console.log('No relevant foreign key relationships found');
    }

    // Query 7: Sample data from any finish/option tables found
    if (finishResult.rows.length > 0) {
      console.log('\n=== SAMPLE DATA FROM FINISH/OPTION TABLES ===');
      for (const table of finishResult.rows) {
        try {
          console.log(`\n--- ${table.table_name} ---`);
          const sampleQuery = `SELECT * FROM "${table.table_name}" LIMIT 3;`;
          const sampleResult = await client.query(sampleQuery);
          
          if (sampleResult.rows.length > 0) {
            console.log(`Found ${sampleResult.rows.length} records:`);
            sampleResult.rows.forEach((row, index) => {
              console.log(`  Record ${index + 1}:`, JSON.stringify(row, null, 2));
            });
          } else {
            console.log('Table is empty');
          }
        } catch (err) {
          console.log(`Error querying ${table.table_name}:`, err.message);
        }
      }
    }

  } catch (error) {
    console.error('Database connection failed:', error);
  } finally {
    await client.end();
  }
}

checkActualTableNames().catch(console.error);