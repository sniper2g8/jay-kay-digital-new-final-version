import { readFile } from 'fs/promises';
import { Client } from 'pg';

async function importData() {
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

    // Read the data.sql file
    const dataSql = await readFile('supabase/data.sql', 'utf8');
    
    // Split the file into individual statements
    // Note: This is a simple split and may not work for complex SQL files
    const statements = dataSql.split(';').filter(stmt => stmt.trim() !== '');
    
    console.log(`Found ${statements.length} statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          await client.query(statement);
          console.log(`Executed statement ${i + 1}/${statements.length}`);
        } catch (err) {
          console.error(`Error executing statement ${i + 1}:`, err.message);
          // Continue with the next statement
        }
      }
    }
    
    console.log('Data import completed');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

importData();