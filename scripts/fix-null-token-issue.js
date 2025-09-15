const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function fixNullTokenIssue() {
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
    console.log('🔍 Investigating NULL token conversion issues...\n');

    // 1. First, let's examine the exact issue
    console.log('=== Checking auth.users token column types ===');
    try {
      const columnInfo = await client.query(`
        SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND table_schema = 'auth'
        AND column_name LIKE '%token%'
        ORDER BY column_name
      `);
      
      console.log('Token columns in auth.users:');
      columnInfo.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
    } catch (error) {
      console.log('⚠ Cannot access column information:', error.message);
    }

    // 2. Check for problematic token values
    console.log('\n=== Checking for problematic token values ===');
    try {
      const tokenCheck = await client.query(`
        SELECT 
          id,
          email,
          CASE 
            WHEN confirmation_token = '' THEN 'EMPTY_STRING'
            WHEN confirmation_token IS NULL THEN 'NULL'
            WHEN LENGTH(confirmation_token) = 0 THEN 'ZERO_LENGTH'
            ELSE 'HAS_VALUE'
          END as confirmation_token_status,
          CASE 
            WHEN recovery_token = '' THEN 'EMPTY_STRING'
            WHEN recovery_token IS NULL THEN 'NULL'
            WHEN LENGTH(recovery_token) = 0 THEN 'ZERO_LENGTH'
            ELSE 'HAS_VALUE'
          END as recovery_token_status,
          CASE 
            WHEN email_change_token_new = '' THEN 'EMPTY_STRING'
            WHEN email_change_token_new IS NULL THEN 'NULL'
            WHEN LENGTH(email_change_token_new) = 0 THEN 'ZERO_LENGTH'
            ELSE 'HAS_VALUE'
          END as email_change_token_new_status
        FROM auth.users
        ORDER BY created_at DESC
        LIMIT 10
      `);
      
      console.log('Token status for recent users:');
      tokenCheck.rows.forEach(user => {
        console.log(`  ${user.email}:`);
        console.log(`    confirmation_token: ${user.confirmation_token_status}`);
        console.log(`    recovery_token: ${user.recovery_token_status}`);
        console.log(`    email_change_token_new: ${user.email_change_token_new_status}`);
      });
      
    } catch (error) {
      console.log('⚠ Cannot check token values:', error.message);
    }

    // 3. Try the comprehensive fix
    console.log('\n=== Applying comprehensive token fix ===');
    try {
      // Fix all possible problematic token values
      const fixes = [
        {
          name: 'confirmation_token',
          query: "UPDATE auth.users SET confirmation_token = NULL WHERE confirmation_token = '' OR LENGTH(COALESCE(confirmation_token, '')) = 0"
        },
        {
          name: 'recovery_token',
          query: "UPDATE auth.users SET recovery_token = NULL WHERE recovery_token = '' OR LENGTH(COALESCE(recovery_token, '')) = 0"
        },
        {
          name: 'email_change_token_new',
          query: "UPDATE auth.users SET email_change_token_new = NULL WHERE email_change_token_new = '' OR LENGTH(COALESCE(email_change_token_new, '')) = 0"
        },
        {
          name: 'email_change_token_current',
          query: "UPDATE auth.users SET email_change_token_current = NULL WHERE email_change_token_current = '' OR LENGTH(COALESCE(email_change_token_current, '')) = 0"
        },
        {
          name: 'phone_change_token',
          query: "UPDATE auth.users SET phone_change_token = NULL WHERE phone_change_token = '' OR LENGTH(COALESCE(phone_change_token, '')) = 0"
        }
      ];

      for (const fix of fixes) {
        try {
          const result = await client.query(fix.query);
          console.log(`✓ Fixed ${result.rowCount} rows for ${fix.name}`);
        } catch (error) {
          console.log(`❌ Error fixing ${fix.name}:`, error.message);
        }
      }

    } catch (error) {
      console.log('❌ Error in comprehensive fix:', error.message);
    }

    // 4. Alternative approach - try to recreate the problematic scenario
    console.log('\n=== Testing auth token scanning ===');
    try {
      // Simulate what Supabase auth service might be doing
      const testQuery = await client.query(`
        SELECT 
          id, 
          email, 
          confirmation_token,
          recovery_token,
          email_change_token_new
        FROM auth.users 
        WHERE email = 'delsenterprise@gmail.com'
        LIMIT 1
      `);
      
      console.log('✓ Direct token query successful');
      if (testQuery.rows.length > 0) {
        const user = testQuery.rows[0];
        console.log(`  confirmation_token: ${user.confirmation_token === null ? 'NULL' : user.confirmation_token}`);
        console.log(`  recovery_token: ${user.recovery_token === null ? 'NULL' : user.recovery_token}`);
      }
      
    } catch (error) {
      console.log('❌ Token scanning test failed:', error.message);
    }

    // 5. Check if we need to contact Supabase support
    console.log('\n=== Final verification ===');
    try {
      const finalCheck = await client.query(`
        SELECT COUNT(*) as total_users,
               COUNT(CASE WHEN confirmation_token = '' THEN 1 END) as empty_confirmation_tokens,
               COUNT(CASE WHEN recovery_token = '' THEN 1 END) as empty_recovery_tokens
        FROM auth.users
      `);
      
      const stats = finalCheck.rows[0];
      console.log(`Total users: ${stats.total_users}`);
      console.log(`Empty confirmation tokens: ${stats.empty_confirmation_tokens}`);
      console.log(`Empty recovery tokens: ${stats.empty_recovery_tokens}`);
      
      if (stats.empty_confirmation_tokens > 0 || stats.empty_recovery_tokens > 0) {
        console.log('\n🚨 ISSUE PERSISTS: Still found empty string tokens');
        console.log('📧 You may need to contact Supabase Support to fix this at the database level');
        console.log('🔗 Reference this error: "converting NULL to string is unsupported" in auth.users tokens');
      } else {
        console.log('\n✅ All empty string tokens have been cleaned up');
      }
      
    } catch (error) {
      console.log('⚠ Cannot verify final state:', error.message);
    }

    console.log('\n🎯 Fix attempt completed!');

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    try {
      await client.end();
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

fixNullTokenIssue().catch(console.error);