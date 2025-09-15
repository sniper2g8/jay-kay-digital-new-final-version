const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function applyTemporaryWorkaround() {
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
    console.log('🔧 Applying TEMPORARY workaround for Supabase Auth service bug...\n');
    console.log('⚠️  WARNING: This sets tokens to empty strings instead of NULL');
    console.log('⚠️  This is NOT a proper fix - contact Supabase Support for permanent solution\n');

    // Apply the workaround
    const result = await client.query(`
      UPDATE auth.users 
      SET 
        confirmation_token = COALESCE(confirmation_token, ''),
        recovery_token = COALESCE(recovery_token, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        email_change_token_current = COALESCE(email_change_token_current, ''),
        phone_change_token = COALESCE(phone_change_token, ''),
        reauthentication_token = COALESCE(reauthentication_token, '')
      WHERE 
        confirmation_token IS NULL 
        OR recovery_token IS NULL 
        OR email_change_token_new IS NULL 
        OR email_change_token_current IS NULL 
        OR phone_change_token IS NULL
        OR reauthentication_token IS NULL
    `);

    console.log(`✅ Workaround applied to ${result.rowCount} rows`);

    // Verify the workaround
    const verification = await client.query(`
      SELECT 
        email,
        CASE WHEN confirmation_token = '' THEN 'EMPTY_STRING' ELSE 'HAS_VALUE' END as confirmation_status,
        CASE WHEN recovery_token = '' THEN 'EMPTY_STRING' ELSE 'HAS_VALUE' END as recovery_status
      FROM auth.users 
      ORDER BY created_at DESC
      LIMIT 5
    `);

    console.log('\n📊 Token status after workaround:');
    verification.rows.forEach(user => {
      console.log(`  ${user.email}: confirmation=${user.confirmation_status}, recovery=${user.recovery_status}`);
    });

    console.log('\n🎯 Temporary workaround completed!');
    console.log('📧 IMPORTANT: Contact Supabase Support to fix their auth service');
    console.log('🔗 Reference: "converting NULL to string is unsupported" in auth token scanning');

  } catch (error) {
    console.error('❌ Workaround failed:', error.message);
  } finally {
    try {
      await client.end();
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

console.log('🚨 TEMPORARY WORKAROUND - NOT A PERMANENT FIX');
console.log('This will set NULL tokens to empty strings to bypass Supabase auth service bug\n');

applyTemporaryWorkaround().catch(console.error);