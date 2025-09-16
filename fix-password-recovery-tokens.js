// Fix password recovery NULL token conversion issues
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixPasswordRecoveryTokens() {
  let client;
  try {
    client = await pool.connect();
    
    console.log('🔧 Fixing Password Recovery Token Issues...');
    console.log('============================================');
    
    // Step 1: Check current problematic tokens
    console.log('\n1️⃣ Analyzing current token field issues...');
    const problemCheck = await client.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN confirmation_token = '' THEN 1 END) as bad_confirmation_tokens,
        COUNT(CASE WHEN recovery_token = '' THEN 1 END) as bad_recovery_tokens,
        COUNT(CASE WHEN email_change_token_new = '' THEN 1 END) as bad_email_change_tokens
      FROM auth.users
    `);
    
    const stats = problemCheck.rows[0];
    console.log(`   Total users: ${stats.total_users}`);
    console.log(`   Users with empty confirmation_token: ${stats.bad_confirmation_tokens}`);
    console.log(`   Users with empty recovery_token: ${stats.bad_recovery_tokens}`);
    console.log(`   Users with empty email_change_token: ${stats.bad_email_change_tokens}`);
    
    // Step 2: Fix confirmation_token (main issue)
    console.log('\n2️⃣ Fixing confirmation_token field...');
    const confirmationFix = await client.query(`
      UPDATE auth.users 
      SET confirmation_token = NULL 
      WHERE confirmation_token = ''
    `);
    console.log(`   ✅ Fixed ${confirmationFix.rowCount} confirmation_token fields`);
    
    // Step 3: Fix recovery_token
    console.log('\n3️⃣ Fixing recovery_token field...');
    const recoveryFix = await client.query(`
      UPDATE auth.users 
      SET recovery_token = NULL 
      WHERE recovery_token = ''
    `);
    console.log(`   ✅ Fixed ${recoveryFix.rowCount} recovery_token fields`);
    
    // Step 4: Fix email change tokens
    console.log('\n4️⃣ Fixing email change token fields...');
    const emailNewFix = await client.query(`
      UPDATE auth.users 
      SET email_change_token_new = NULL 
      WHERE email_change_token_new = ''
    `);
    const emailCurrentFix = await client.query(`
      UPDATE auth.users 
      SET email_change_token_current = NULL 
      WHERE email_change_token_current = ''
    `);
    console.log(`   ✅ Fixed ${emailNewFix.rowCount} email_change_token_new fields`);
    console.log(`   ✅ Fixed ${emailCurrentFix.rowCount} email_change_token_current fields`);
    
    // Step 5: Fix phone change token
    console.log('\n5️⃣ Fixing phone change token field...');
    const phoneFix = await client.query(`
      UPDATE auth.users 
      SET phone_change_token = NULL 
      WHERE phone_change_token = ''
    `);
    console.log(`   ✅ Fixed ${phoneFix.rowCount} phone_change_token fields`);
    
    // Step 6: Verification
    console.log('\n6️⃣ Verification - checking all tokens are clean...');
    const verification = await client.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN confirmation_token = '' THEN 1 END) as bad_confirmation_tokens,
        COUNT(CASE WHEN recovery_token = '' THEN 1 END) as bad_recovery_tokens,
        COUNT(CASE WHEN email_change_token_new = '' THEN 1 END) as bad_email_change_tokens,
        COUNT(CASE WHEN phone_change_token = '' THEN 1 END) as bad_phone_change_tokens
      FROM auth.users
    `);
    
    const finalStats = verification.rows[0];
    console.log('   Final token field status:');
    console.log(`   - Bad confirmation_token: ${finalStats.bad_confirmation_tokens} (should be 0)`);
    console.log(`   - Bad recovery_token: ${finalStats.bad_recovery_tokens} (should be 0)`);
    console.log(`   - Bad email_change_token: ${finalStats.bad_email_change_tokens} (should be 0)`);
    console.log(`   - Bad phone_change_token: ${finalStats.bad_phone_change_tokens} (should be 0)`);
    
    if (finalStats.bad_confirmation_tokens == 0 && finalStats.bad_recovery_tokens == 0) {
      console.log('\n🎉 SUCCESS: All auth token fields are now properly cleaned!');
      console.log('✅ Password recovery should now work for all users');
    } else {
      console.log('\n⚠️  Some token fields still need cleaning');
    }
    
    // Test specific users that were failing
    console.log('\n7️⃣ Testing previously failing users...');
    const userCheck = await client.query(`
      SELECT 
        email,
        confirmation_token IS NULL as confirmation_clean,
        recovery_token IS NULL as recovery_clean
      FROM auth.users 
      WHERE email IN ('admin@jaykaydigitalpress.com', 'hello@ishmaelbull.xyz')
      ORDER BY email
    `);
    
    userCheck.rows.forEach(user => {
      console.log(`   ${user.email}: confirmation_token=${user.confirmation_clean ? 'NULL✅' : 'BAD❌'}, recovery_token=${user.recovery_clean ? 'NULL✅' : 'BAD❌'}`);
    });
    
    console.log('\n🚀 Password recovery token cleanup completed!');
    console.log('   Next: Test password recovery at http://localhost:3000/auth/forgot-password');
    
  } catch (err) {
    console.error('💥 Error fixing tokens:', err.message);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

fixPasswordRecoveryTokens();