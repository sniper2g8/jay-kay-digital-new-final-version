const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

async function checkAllAuthTokens() {
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
    console.log("🔍 Checking ALL Auth Token Fields for Empty Strings\n");

    // Check ALL token fields for empty strings
    const checkTokens = await client.query(`
      SELECT 
        email,
        CASE 
          WHEN confirmation_token = '' THEN 'EMPTY_STRING' 
          WHEN confirmation_token IS NULL THEN 'NULL' 
          ELSE 'HAS_VALUE' 
        END as confirmation_token_status,
        CASE 
          WHEN recovery_token = '' THEN 'EMPTY_STRING' 
          WHEN recovery_token IS NULL THEN 'NULL' 
          ELSE 'HAS_VALUE' 
        END as recovery_token_status,
        CASE 
          WHEN email_change_token_new = '' THEN 'EMPTY_STRING' 
          WHEN email_change_token_new IS NULL THEN 'NULL' 
          ELSE 'HAS_VALUE' 
        END as email_change_new_status,
        CASE 
          WHEN email_change_token_current = '' THEN 'EMPTY_STRING' 
          WHEN email_change_token_current IS NULL THEN 'NULL' 
          ELSE 'HAS_VALUE' 
        END as email_change_current_status,
        CASE 
          WHEN phone_change_token = '' THEN 'EMPTY_STRING' 
          WHEN phone_change_token IS NULL THEN 'NULL' 
          ELSE 'HAS_VALUE' 
        END as phone_change_token_status,
        CASE 
          WHEN reauthentication_token = '' THEN 'EMPTY_STRING' 
          WHEN reauthentication_token IS NULL THEN 'NULL' 
          ELSE 'HAS_VALUE' 
        END as reauth_token_status
      FROM auth.users
      ORDER BY email
    `);

    console.log("=== Individual User Token Status ===");
    checkTokens.rows.forEach((user, index) => {
      console.log(`\nUser ${index + 1}: ${user.email}`);
      console.log(`  Confirmation Token: ${user.confirmation_token_status}`);
      console.log(`  Recovery Token: ${user.recovery_token_status}`);
      console.log(`  Email Change New: ${user.email_change_new_status}`);
      console.log(
        `  Email Change Current: ${user.email_change_current_status}`,
      );
      console.log(`  Phone Change Token: ${user.phone_change_token_status}`);
      console.log(`  Reauth Token: ${user.reauth_token_status}`);

      // Flag problematic users
      const hasEmptyStrings = [
        user.confirmation_token_status,
        user.recovery_token_status,
        user.email_change_new_status,
        user.email_change_current_status,
        user.phone_change_token_status,
        user.reauth_token_status,
      ].includes("EMPTY_STRING");

      if (hasEmptyStrings) {
        console.log(
          `  ⚠️  WARNING: This user has EMPTY_STRING tokens that need fixing!`,
        );
      }
    });

    // Summary count
    const summary = await client.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN confirmation_token = '' THEN 1 END) as empty_confirmation,
        COUNT(CASE WHEN recovery_token = '' THEN 1 END) as empty_recovery,
        COUNT(CASE WHEN email_change_token_new = '' THEN 1 END) as empty_email_new,
        COUNT(CASE WHEN email_change_token_current = '' THEN 1 END) as empty_email_current,
        COUNT(CASE WHEN phone_change_token = '' THEN 1 END) as empty_phone_change,
        COUNT(CASE WHEN reauthentication_token = '' THEN 1 END) as empty_reauth
      FROM auth.users
    `);

    console.log("\n=== Summary of Empty String Tokens ===");
    const stats = summary.rows[0];
    console.log(`Total users: ${stats.total_users}`);
    console.log(`Empty confirmation tokens: ${stats.empty_confirmation}`);
    console.log(`Empty recovery tokens: ${stats.empty_recovery}`);
    console.log(`Empty email_change_token_new: ${stats.empty_email_new}`);
    console.log(
      `Empty email_change_token_current: ${stats.empty_email_current}`,
    );
    console.log(`Empty phone_change_token: ${stats.empty_phone_change}`);
    console.log(`Empty reauthentication_token: ${stats.empty_reauth}`);

    const totalProblems =
      parseInt(stats.empty_confirmation) +
      parseInt(stats.empty_recovery) +
      parseInt(stats.empty_email_new) +
      parseInt(stats.empty_email_current) +
      parseInt(stats.empty_phone_change) +
      parseInt(stats.empty_reauth);

    if (totalProblems > 0) {
      console.log(
        `\n🚨 FOUND ${totalProblems} EMPTY STRING TOKENS THAT NEED FIXING!`,
      );
    } else {
      console.log(
        "\n✅ All tokens are properly set to NULL - no empty strings found",
      );
    }
  } catch (error) {
    console.error("❌ Error checking auth tokens:", error.message);
  } finally {
    try {
      await client.end();
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

checkAllAuthTokens().catch(console.error);
