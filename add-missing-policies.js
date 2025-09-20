import { Client } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local
const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

async function addMissingPolicies() {
  console.log('=== Adding Missing Policies ===');
  
  // Get database URL from environment variables
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in .env.local');
    process.exit(1);
  }
  
  const client = new Client({
    connectionString: databaseUrl,
  });
  
  try {
    await client.connect();
    console.log('✅ Direct database connection successful');
    
    // Read the missing policies SQL
    const sqlFilePath = path.resolve('add-missing-policies.sql');
    if (!fs.existsSync(sqlFilePath)) {
      console.error('❌ add-missing-policies.sql not found');
      await client.end();
      process.exit(1);
    }
    
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('✅ Loaded missing policies SQL');
    
    // Split the SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`1. Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.startsWith('--') || statement.trim().length === 0) {
        continue; // Skip comments and empty statements
      }
      
      try {
        console.log(`   Executing statement ${i + 1}/${statements.length}...`);
        await client.query(statement);
        console.log(`   ✅ Statement ${i + 1} executed successfully`);
      } catch (error) {
        console.error(`   ❌ Statement ${i + 1} failed:`, error.message);
        // Don't exit on error, continue with other statements
      }
    }
    
    // Verify the policies
    console.log('2. Verifying policies...');
    const policiesResult = await client.query(`
      SELECT policyname, cmd FROM pg_policies WHERE tablename = 'jobs'
    `);
    
    console.log('   Current policies after adding missing ones:');
    policiesResult.rows.forEach(row => {
      console.log(`   - ${row.policyname} (${row.cmd})`);
    });
    
    await client.end();
    console.log('\n=== Missing Policies Added Successfully ===');
    console.log('\n💡 Next steps:');
    console.log('   For the policies to work, a user must be authenticated');
    console.log('   The application should handle authentication properly');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

addMissingPolicies().catch(console.error);