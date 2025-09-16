// Check current auth.users schema state vs expected Supabase schema
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkAuthSchemaCompliance() {
  let client;
  try {
    client = await pool.connect();
    
    console.log('🔍 Checking Auth Schema Compliance vs Official Supabase Schema...');
    console.log('=================================================================');
    
    // Check current state
    const result = await client.query(`
      SELECT 
        email,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change_token_current,
        phone_change,
        phone_change_token,
        reauthentication_token,
        -- Check if they match expected empty string pattern
        confirmation_token = '' as confirmation_is_empty_string,
        confirmation_token IS NULL as confirmation_is_null,
        recovery_token = '' as recovery_is_empty_string,
        recovery_token IS NULL as recovery_is_null
      FROM auth.users 
      WHERE email = 'admin@jaykaydigitalpress.com'
    `);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('\n📊 Current State vs Expected Schema:');
      console.log('=====================================');
      console.log(`Email: ${user.email}`);
      console.log('');
      
      // Check each field against expected schema
      const fields = [
        'confirmation_token',
        'recovery_token', 
        'email_change_token_new',
        'email_change_token_current',
        'phone_change',
        'phone_change_token',
        'reauthentication_token'
      ];
      
      fields.forEach(field => {
        const value = user[field];
        const isCorrect = value === '';
        const status = isCorrect ? '✅ CORRECT' : (value === null ? '❌ NULL (should be "")' : '⚠️ HAS VALUE');
        console.log(`${field}: "${value}" - ${status}`);
      });
      
      console.log('\n🎯 Schema Compliance Summary:');
      console.log(`confirmation_token: ${user.confirmation_is_empty_string ? '✅ Empty string' : (user.confirmation_is_null ? '❌ NULL' : '⚠️ Has value')}`);
      console.log(`recovery_token: ${user.recovery_is_empty_string ? '✅ Empty string' : (user.recovery_is_null ? '❌ NULL' : '⚠️ Has value')}`);
      
    } else {
      console.log('❌ User not found');
    }
    
    // Check if we have any NULL values that should be empty strings
    const nullCheck = await client.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN confirmation_token IS NULL THEN 1 END) as null_confirmation_tokens,
        COUNT(CASE WHEN recovery_token IS NULL THEN 1 END) as null_recovery_tokens,
        COUNT(CASE WHEN email_change_token_new IS NULL THEN 1 END) as null_email_change_tokens
      FROM auth.users
    `);
    
    const stats = nullCheck.rows[0];
    console.log('\n📈 Database-wide NULL Token Analysis:');
    console.log('====================================');
    console.log(`Total users: ${stats.total_users}`);
    console.log(`Users with NULL confirmation_token: ${stats.null_confirmation_tokens} (should be 0)`);
    console.log(`Users with NULL recovery_token: ${stats.null_recovery_tokens} (should be 0)`);  
    console.log(`Users with NULL email_change_token: ${stats.null_email_change_tokens} (should be 0)`);
    
    if (stats.null_confirmation_tokens > 0 || stats.null_recovery_tokens > 0) {
      console.log('\n⚠️  ISSUE FOUND: Some token fields are NULL when they should be empty strings');
      console.log('🔧 SOLUTION: Run restore-correct-auth-schema.sql to fix this');
    } else {
      console.log('\n✅ Schema compliance looks good - all token fields are empty strings as expected');
      console.log('🤔 If password recovery still fails, this is likely a Supabase backend bug');
    }
    
  } catch (err) {
    console.error('💥 Error:', err.message);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

checkAuthSchemaCompliance();