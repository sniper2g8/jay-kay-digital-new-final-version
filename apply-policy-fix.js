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

async function applyPolicyFix() {
  console.log('=== Applying Policy Fix ===');
  
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
    
    // Read the comprehensive policy fix SQL
    const sqlFilePath = path.resolve('comprehensive-policy-fix.sql');
    if (!fs.existsSync(sqlFilePath)) {
      console.error('❌ comprehensive-policy-fix.sql not found');
      await client.end();
      process.exit(1);
    }
    
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('✅ Loaded comprehensive policy fix SQL');
    
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
    
    // Verify the new policies
    console.log('2. Verifying new policies...');
    const policiesResult = await client.query(`
      SELECT policyname, cmd FROM pg_policies WHERE tablename = 'jobs'
    `);
    
    console.log('   Current policies after fix:');
    policiesResult.rows.forEach(row => {
      console.log(`   - ${row.policyname} (${row.cmd})`);
    });
    
    await client.end();
    console.log('\n=== Policy Fix Applied Successfully ===');
    console.log('\n💡 Next steps:');
    console.log('   Run node check-rls-supabase-client.js to verify the fix works');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

applyPolicyFix().catch(console.error);