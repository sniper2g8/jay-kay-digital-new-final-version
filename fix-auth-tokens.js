const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

async function fixAuthTokens() {
  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log(
      "🔧 Fixing Supabase Auth Tokens - Setting Empty Strings to NULL\n",
    );

    // Step 1: Check current state
    console.log("=== Current Token State ===");
    const currentState = await client.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN confirmation_token = '' THEN 1 END) as empty_confirmation_tokens,
        COUNT(CASE WHEN recovery_token = '' THEN 1 END) as empty_recovery_tokens,
        COUNT(CASE WHEN email_change_token_new = '' THEN 1 END) as empty_email_change_new_tokens,
        COUNT(CASE WHEN email_change_token_current = '' THEN 1 END) as empty_email_change_current_tokens,
        COUNT(CASE WHEN phone_change_token = '' THEN 1 END) as empty_phone_change_tokens,
        COUNT(CASE WHEN reauthentication_token = '' THEN 1 END) as empty_reauth_tokens
      FROM auth.users
    `);

    const stats = currentState.rows[0];
    console.log(`Total users: ${stats.total_users}`);
    console.log(
      `Empty confirmation tokens: ${stats.empty_confirmation_tokens}`,
    );
    console.log(`Empty recovery tokens: ${stats.empty_recovery_tokens}`);
    console.log(
      `Empty email change new tokens: ${stats.empty_email_change_new_tokens}`,
    );
    console.log(
      `Empty email change current tokens: ${stats.empty_email_change_current_tokens}`,
    );
    console.log(
      `Empty phone change tokens: ${stats.empty_phone_change_tokens}`,
    );
    console.log(`Empty reauth tokens: ${stats.empty_reauth_tokens}`);

    // Step 2: Apply the fix
    console.log("\n=== Applying Fix ===");
    const fixResult = await client.query(`
      UPDATE auth.users 
      SET 
        confirmation_token = NULLIF(confirmation_token, ''),
        recovery_token = NULLIF(recovery_token, ''),
        email_change_token_new = NULLIF(email_change_token_new, ''),
        email_change_token_current = NULLIF(email_change_token_current, ''),
        phone_change_token = NULLIF(phone_change_token, ''),
        reauthentication_token = NULLIF(reauthentication_token, '')
      WHERE 
        confirmation_token = '' 
        OR recovery_token = '' 
        OR email_change_token_new = '' 
        OR email_change_token_current = '' 
        OR phone_change_token = ''
        OR reauthentication_token = ''
    `);

    console.log(`✅ Updated ${fixResult.rowCount} user records`);

    // Step 3: Verify the fix
    console.log("\n=== After Fix - Verification ===");
    const afterState = await client.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN confirmation_token IS NULL THEN 1 END) as null_confirmation_tokens,
        COUNT(CASE WHEN recovery_token IS NULL THEN 1 END) as null_recovery_tokens,
        COUNT(CASE WHEN email_change_token_new IS NULL THEN 1 END) as null_email_change_new_tokens,
        COUNT(CASE WHEN email_change_token_current IS NULL THEN 1 END) as null_email_change_current_tokens,
        COUNT(CASE WHEN phone_change_token IS NULL THEN 1 END) as null_phone_change_tokens,
        COUNT(CASE WHEN reauthentication_token IS NULL THEN 1 END) as null_reauth_tokens
      FROM auth.users
    `);

    const afterStats = afterState.rows[0];
    console.log(`Total users: ${afterStats.total_users}`);
    console.log(
      `NULL confirmation tokens: ${afterStats.null_confirmation_tokens} (should equal total)`,
    );
    console.log(
      `NULL recovery tokens: ${afterStats.null_recovery_tokens} (should equal total)`,
    );
    console.log(
      `NULL email change new tokens: ${afterStats.null_email_change_new_tokens} (should equal total)`,
    );
    console.log(
      `NULL email change current tokens: ${afterStats.null_email_change_current_tokens} (should equal total)`,
    );
    console.log(
      `NULL phone change tokens: ${afterStats.null_phone_change_tokens} (should equal total)`,
    );
    console.log(
      `NULL reauth tokens: ${afterStats.null_reauth_tokens} (should equal total)`,
    );

    // Step 4: Show sample users
    console.log("\n=== Sample User Token Status ===");
    const sampleUsers = await client.query(`
      SELECT 
        email,
        CASE 
          WHEN confirmation_token IS NULL THEN 'NULL (CORRECT)' 
          WHEN confirmation_token = '' THEN 'EMPTY_STRING (BAD)' 
          ELSE 'HAS_VALUE' 
        END as confirmation_status,
        CASE 
          WHEN recovery_token IS NULL THEN 'NULL (CORRECT)' 
          WHEN recovery_token = '' THEN 'EMPTY_STRING (BAD)' 
          ELSE 'HAS_VALUE' 
        END as recovery_status
      FROM auth.users 
      LIMIT 5
    `);

    sampleUsers.rows.forEach((user, index) => {
      console.log(`User ${index + 1}: ${user.email}`);
      console.log(`  Confirmation: ${user.confirmation_status}`);
      console.log(`  Recovery: ${user.recovery_status}`);
    });

    console.log("\n🎉 Auth token fix completed successfully!");
    console.log(
      "✅ All empty string tokens have been set to proper NULL values",
    );
    console.log(
      "🔐 Authentication should now work properly without null string conversion errors",
    );
  } catch (error) {
    console.error("❌ Error fixing auth tokens:", error.message);
    console.error("Full error:", error);
  } finally {
    try {
      await client.end();
    } catch (error) {
      // Ignore connection cleanup errors
    }
  }
}

console.log("🚀 Starting Auth Token Fix Process...");
console.log('📋 This will fix the "converting NULL to string" auth error');
console.log("🔧 Setting empty string tokens to proper NULL values\n");

fixAuthTokens().catch(console.error);
