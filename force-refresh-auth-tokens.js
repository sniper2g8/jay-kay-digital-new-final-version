const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

async function forceRefreshAuthTokens() {
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
      "🔧 Force Refreshing Auth Tokens - Setting ALL to NULL explicitly\n",
    );

    // Force set ALL possible token fields to NULL, regardless of current value
    const forceUpdate = await client.query(`
      UPDATE auth.users 
      SET 
        confirmation_token = NULL,
        recovery_token = NULL,
        email_change_token_new = NULL,
        email_change_token_current = NULL,
        phone_change_token = NULL,
        reauthentication_token = NULL,
        email_change_confirm_status = 0,
        email_change = NULL,
        phone_change = NULL,
        phone_change_sent_at = NULL,
        confirmation_sent_at = NULL,
        recovery_sent_at = NULL,
        email_change_sent_at = NULL
      WHERE 1=1
    `);

    console.log(`✅ Force updated ${forceUpdate.rowCount} user records`);

    // Also check if there are any new columns we missed
    const columnCheck = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'auth' 
        AND table_name = 'users' 
        AND column_name LIKE '%token%'
      ORDER BY column_name
    `);

    console.log("\n=== All Token Columns in auth.users ===");
    columnCheck.rows.forEach((col) => {
      console.log(
        `${col.column_name}: ${col.data_type}, nullable: ${col.is_nullable}, default: ${col.column_default}`,
      );
    });

    // Verify all token fields are now NULL
    const verification = await client.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN confirmation_token IS NULL THEN 1 END) as null_confirmation,
        COUNT(CASE WHEN recovery_token IS NULL THEN 1 END) as null_recovery,
        COUNT(CASE WHEN email_change_token_new IS NULL THEN 1 END) as null_email_new,
        COUNT(CASE WHEN email_change_token_current IS NULL THEN 1 END) as null_email_current,
        COUNT(CASE WHEN phone_change_token IS NULL THEN 1 END) as null_phone_change,
        COUNT(CASE WHEN reauthentication_token IS NULL THEN 1 END) as null_reauth,
        COUNT(CASE WHEN confirmation_token = '' THEN 1 END) as empty_confirmation,
        COUNT(CASE WHEN recovery_token = '' THEN 1 END) as empty_recovery,
        COUNT(CASE WHEN phone_change_token = '' THEN 1 END) as empty_phone_change,
        COUNT(CASE WHEN reauthentication_token = '' THEN 1 END) as empty_reauth_check
      FROM auth.users
    `);

    const stats = verification.rows[0];
    console.log("\n=== Verification Results ===");
    console.log(`Total users: ${stats.total_users}`);
    console.log(
      `NULL confirmation tokens: ${stats.null_confirmation} (should equal total)`,
    );
    console.log(
      `NULL recovery tokens: ${stats.null_recovery} (should equal total)`,
    );
    console.log(
      `NULL email_change_token_new: ${stats.null_email_new} (should equal total)`,
    );
    console.log(
      `NULL email_change_token_current: ${stats.null_email_current} (should equal total)`,
    );
    console.log(
      `NULL phone_change_token: ${stats.null_phone_change} (should equal total)`,
    );
    console.log(
      `NULL reauthentication_token: ${stats.null_reauth} (should equal total)`,
    );
    console.log("---");
    console.log(
      `Empty string confirmation tokens: ${stats.empty_confirmation} (should be 0)`,
    );
    console.log(
      `Empty string recovery tokens: ${stats.empty_recovery} (should be 0)`,
    );
    console.log(
      `Empty string phone_change tokens: ${stats.empty_phone_change} (should be 0)`,
    );
    console.log(
      `Empty string reauth tokens: ${stats.empty_reauth_check} (should be 0)`,
    );

    console.log(
      "\n🎉 Force refresh completed - all auth tokens explicitly set to NULL",
    );
  } catch (error) {
    console.error("❌ Error force refreshing auth tokens:", error.message);
    console.error("Full error:", error);
  } finally {
    try {
      await client.end();
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

console.log("🚀 Starting Force Auth Token Refresh...");
console.log("📋 This will explicitly set ALL auth tokens to NULL");
console.log("🔧 This should resolve any cached or lingering auth issues\n");

forceRefreshAuthTokens().catch(console.error);
