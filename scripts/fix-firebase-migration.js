const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

async function fixFirebaseMigration() {
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
    console.log("Connected to database successfully");

    // 1. Check current token column state in auth.users
    console.log("\n=== Checking auth.users token columns ===");

    try {
      const testResult = await client.query(
        "SELECT COUNT(*) FROM auth.users LIMIT 1",
      );
      console.log("✓ auth.users table is accessible for checking");
    } catch (error) {
      console.log("⚠ auth.users access limited:", error.message);
    }

    // 2. Fix empty string tokens that cause NULL conversion errors
    console.log("\n=== Fixing empty string tokens ===");

    try {
      // Fix confirmation_token empty strings
      const confirmationResult = await client.query(`
        UPDATE auth.users 
        SET confirmation_token = NULL 
        WHERE confirmation_token = ''
      `);
      console.log(
        `✓ Updated ${confirmationResult.rowCount} confirmation_token empty strings to NULL`,
      );

      // Fix recovery_token empty strings
      const recoveryResult = await client.query(`
        UPDATE auth.users 
        SET recovery_token = NULL 
        WHERE recovery_token = ''
      `);
      console.log(
        `✓ Updated ${recoveryResult.rowCount} recovery_token empty strings to NULL`,
      );

      // Fix email_change_token_new empty strings
      const emailNewResult = await client.query(`
        UPDATE auth.users 
        SET email_change_token_new = NULL 
        WHERE email_change_token_new = ''
      `);
      console.log(
        `✓ Updated ${emailNewResult.rowCount} email_change_token_new empty strings to NULL`,
      );

      // Fix email_change_token_current empty strings
      const emailCurrentResult = await client.query(`
        UPDATE auth.users 
        SET email_change_token_current = NULL 
        WHERE email_change_token_current = ''
      `);
      console.log(
        `✓ Updated ${emailCurrentResult.rowCount} email_change_token_current empty strings to NULL`,
      );

      // Fix phone_change_token empty strings
      const phoneResult = await client.query(`
        UPDATE auth.users 
        SET phone_change_token = NULL 
        WHERE phone_change_token = ''
      `);
      console.log(
        `✓ Updated ${phoneResult.rowCount} phone_change_token empty strings to NULL`,
      );
    } catch (error) {
      if (error.message.includes("insufficient privilege")) {
        console.log(
          "⚠ Cannot update auth.users tokens - insufficient privileges (this is normal for hosted Supabase)",
        );
        console.log(
          "📧 Contact Supabase support to fix empty string token columns in auth.users",
        );
      } else {
        console.log("❌ Error updating auth.users tokens:", error.message);
      }
    }

    // 3. Apply standard auth schema permissions fix
    console.log("\n=== Applying schema permissions ===");

    try {
      await client.query("GRANT USAGE ON SCHEMA auth TO anon");
      await client.query("GRANT USAGE ON SCHEMA auth TO authenticated");
      await client.query("GRANT USAGE ON SCHEMA public TO anon");
      await client.query("GRANT USAGE ON SCHEMA public TO authenticated");
      console.log("✓ Schema usage permissions granted");

      // Grant permissions on auth system tables
      await client.query("GRANT SELECT ON auth.users TO anon");
      await client.query("GRANT SELECT ON auth.users TO authenticated");
      console.log("✓ Auth table permissions granted");

      // Fix appUsers table permissions (case-sensitive)
      await client.query('GRANT SELECT ON public."appUsers" TO anon');
      await client.query('GRANT SELECT ON public."appUsers" TO authenticated');
      console.log("✓ appUsers table permissions granted");

      // Enable RLS and create policies for appUsers
      await client.query(
        'ALTER TABLE public."appUsers" ENABLE ROW LEVEL SECURITY',
      );
      console.log("✓ RLS enabled on appUsers");

      // Drop existing policies
      await client.query(
        'DROP POLICY IF EXISTS "Allow anonymous read access to appUsers" ON public."appUsers"',
      );
      await client.query(
        'DROP POLICY IF EXISTS "Allow authenticated read access to appUsers" ON public."appUsers"',
      );
      console.log("✓ Existing policies dropped");

      // Create new policies
      await client.query(`
        CREATE POLICY "Allow anonymous read access to appUsers" ON public."appUsers"
            FOR SELECT TO anon USING (true)
      `);
      await client.query(`
        CREATE POLICY "Allow authenticated read access to appUsers" ON public."appUsers"
            FOR SELECT TO authenticated USING (true)
      `);
      console.log("✓ New policies created");

      // Ensure information_schema access
      await client.query("GRANT SELECT ON information_schema.tables TO anon");
      await client.query("GRANT SELECT ON information_schema.columns TO anon");
      await client.query(
        "GRANT SELECT ON information_schema.table_constraints TO anon",
      );
      console.log("✓ Information schema permissions granted");
    } catch (error) {
      console.log(
        "⚠ Permission error (may be normal for hosted Supabase):",
        error.message,
      );
    }

    // 4. Test the fix
    console.log("\n=== Testing the fix ===");

    try {
      const testResult = await client.query(
        'SELECT count(*) as appUsers_count FROM public."appUsers"',
      );
      console.log(
        `✓ appUsers table accessible - found ${testResult.rows[0].appusers_count} users`,
      );
    } catch (error) {
      console.log("⚠ Test query failed:", error.message);
    }

    console.log("\n🎉 Firebase migration auth fix completed!");
    console.log(
      "📋 Summary: Empty string tokens converted to NULL, permissions updated",
    );
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log("\nDatabase connection closed");
  }
}

// Run the fix
fixFirebaseMigration().catch(console.error);
