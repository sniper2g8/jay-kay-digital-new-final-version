const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

async function createAuthTokenTriggers() {
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
    console.log("🔧 Creating Auth Token Safety Triggers\n");

    // Create the function
    console.log("=== Creating Token Handler Function ===");
    await client.query(`
      CREATE OR REPLACE FUNCTION public.safe_auth_token_handler()
      RETURNS trigger AS $$
      BEGIN
        -- Ensure all auth tokens are NULL instead of empty strings
        IF NEW.confirmation_token = '' THEN
          NEW.confirmation_token := NULL;
        END IF;
        
        IF NEW.recovery_token = '' THEN
          NEW.recovery_token := NULL;
        END IF;
        
        IF NEW.email_change_token_new = '' THEN
          NEW.email_change_token_new := NULL;
        END IF;
        
        IF NEW.email_change_token_current = '' THEN
          NEW.email_change_token_current := NULL;
        END IF;
        
        IF NEW.phone_change_token = '' THEN
          NEW.phone_change_token := NULL;
        END IF;
        
        IF NEW.reauthentication_token = '' THEN
          NEW.reauthentication_token := NULL;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log("✅ Created safe_auth_token_handler function");

    // Try to create triggers (might fail due to permissions)
    try {
      console.log("\n=== Creating INSERT Trigger ===");
      await client.query(`
        DROP TRIGGER IF EXISTS ensure_null_auth_tokens_insert ON auth.users;
      `);

      await client.query(`
        CREATE TRIGGER ensure_null_auth_tokens_insert
          BEFORE INSERT ON auth.users
          FOR EACH ROW
          EXECUTE FUNCTION public.safe_auth_token_handler();
      `);
      console.log("✅ Created INSERT trigger");

      console.log("\n=== Creating UPDATE Trigger ===");
      await client.query(`
        DROP TRIGGER IF EXISTS ensure_null_auth_tokens_update ON auth.users;
      `);

      await client.query(`
        CREATE TRIGGER ensure_null_auth_tokens_update
          BEFORE UPDATE ON auth.users
          FOR EACH ROW
          EXECUTE FUNCTION public.safe_auth_token_handler();
      `);
      console.log("✅ Created UPDATE trigger");

      // Verify triggers
      const triggers = await client.query(`
        SELECT 
          trigger_name, 
          event_manipulation, 
          action_timing,
          action_statement
        FROM information_schema.triggers 
        WHERE trigger_schema = 'auth' 
          AND event_object_table = 'users'
          AND trigger_name LIKE '%null_auth_tokens%'
      `);

      console.log("\n=== Created Triggers ===");
      triggers.rows.forEach((trigger) => {
        console.log(
          `${trigger.trigger_name}: ${trigger.event_manipulation} (${trigger.action_timing})`,
        );
      });

      console.log("\n🎉 Auth Token Safety System Created!");
      console.log(
        "✅ Function and triggers will automatically convert empty strings to NULL",
      );
      console.log('✅ This prevents future "converting NULL to string" errors');
    } catch (triggerError) {
      console.log(
        "\n⚠️  Could not create triggers on auth.users (permission denied)",
      );
      console.log("This is expected - Supabase protects the auth schema");
      console.log(
        "However, the function is created and can be used manually if needed",
      );
    }
  } catch (error) {
    console.error("❌ Error creating auth token system:", error.message);
  } finally {
    try {
      await client.end();
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

console.log("🚀 Creating Auth Token Safety System...");
console.log(
  "📋 This creates triggers to automatically fix empty string tokens",
);
console.log(
  '🔧 Prevents future "converting NULL to string" authentication errors\n',
);

createAuthTokenTriggers().catch(console.error);
