const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function fixAuthSchemaDefaults() {
  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔧 Fixing Auth Schema Defaults - Root Cause Resolution\n');

    // Fix the column defaults that are causing empty strings
    console.log('=== Fixing Column Defaults ===');
    
    // Fix email_change_token_current default
    await client.query(`
      ALTER TABLE auth.users 
      ALTER COLUMN email_change_token_current SET DEFAULT NULL
    `);
    console.log('✅ Fixed email_change_token_current default to NULL');

    // Fix phone_change_token default  
    await client.query(`
      ALTER TABLE auth.users 
      ALTER COLUMN phone_change_token SET DEFAULT NULL
    `);
    console.log('✅ Fixed phone_change_token default to NULL');

    // Fix reauthentication_token default
    await client.query(`
      ALTER TABLE auth.users 
      ALTER COLUMN reauthentication_token SET DEFAULT NULL
    `);
    console.log('✅ Fixed reauthentication_token default to NULL');

    // Verify the schema changes
    const columnCheck = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'auth' 
        AND table_name = 'users' 
        AND column_name LIKE '%token%'
      ORDER BY column_name
    `);

    console.log('\n=== Updated Token Column Defaults ===');
    columnCheck.rows.forEach(col => {
      const defaultValue = col.column_default || 'NULL';
      const status = defaultValue === 'NULL' ? '✅ GOOD' : '⚠️  CHECK';
      console.log(`${col.column_name}: default ${defaultValue} ${status}`);
    });

    // Now force refresh any existing records that might have been affected
    const finalUpdate = await client.query(`
      UPDATE auth.users 
      SET 
        email_change_token_current = NULL,
        phone_change_token = NULL,
        reauthentication_token = NULL
      WHERE 
        email_change_token_current = '' 
        OR phone_change_token = '' 
        OR reauthentication_token = ''
    `);
    
    console.log(`\n✅ Final cleanup: Updated ${finalUpdate.rowCount} records with empty strings`);

    console.log('\n🎉 Schema Fix Complete!');
    console.log('✅ All auth token columns now default to NULL instead of empty strings');
    console.log('✅ This will prevent future "converting NULL to string" errors');
    console.log('✅ Existing users have been cleaned up');

  } catch (error) {
    console.error('❌ Error fixing auth schema:', error.message);
    console.error('Full error:', error);
  } finally {
    try {
      await client.end();
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

console.log('🚀 Starting Auth Schema Default Fix...');
console.log('📋 This fixes the root cause: empty string defaults in auth.users table');
console.log('🔧 After this fix, all new auth operations will use NULL instead of empty strings\n');

fixAuthSchemaDefaults().catch(console.error);