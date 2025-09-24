import { Client } from 'pg';

async function verifyImport() {
  // Database connection details from npx supabase status
  const client = new Client({
    host: '127.0.0.1',
    port: 59999,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres',
  });

  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to the database');

    // Check if some of the custom types exist
    const typeCheck = await client.query(`
      SELECT t.typname 
      FROM pg_type t 
      JOIN pg_namespace n ON t.typnamespace = n.oid 
      WHERE n.nspname = 'public' 
      AND t.typname IN ('job_status_new', 'user_role', 'payment_status')
    `);
    
    console.log('Custom types found:');
    typeCheck.rows.forEach(row => {
      console.log('- ' + row.typname);
    });

    // Check if some tables exist and have data
    const tableCheck = await client.query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE t.table_schema = 'public'
      ORDER BY table_name
      LIMIT 10
    `);
    
    console.log('\nTables in public schema:');
    tableCheck.rows.forEach(row => {
      console.log(`- ${row.table_name} (${row.column_count} columns)`);
    });

    // Check if some specific tables have data
    try {
      const dataCheck = await client.query(`
        SELECT schemaname, tablename, 
               (SELECT COUNT(*) FROM pg_class WHERE relname = t.tablename) as row_count
        FROM pg_tables t
        WHERE schemaname = 'public'
        ORDER BY tablename
        LIMIT 5
      `);
      
      console.log('\nTable data check:');
      dataCheck.rows.forEach(row => {
        console.log(`- ${row.tablename}: ${row.row_count} rows`);
      });
    } catch (err) {
      console.log('Could not check table data:', err.message);
    }

    console.log('\nDatabase verification completed successfully!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

verifyImport();