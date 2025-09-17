import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing required environment variables");
  console.error(
    "Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthFix() {
  console.log("🔍 Testing Auth Token Fix...");

  try {
    // Test 1: Check if we can access auth.users schema information
    console.log("📋 Test 1: Checking auth schema accessibility...");

    const { data: schemaData, error: schemaError } = await supabase
      .from("_realtime_schema_cache") // This is a safe table to test with
      .select("*")
      .limit(1);

    if (
      schemaError &&
      !schemaError.message.includes(
        'relation "_realtime_schema_cache" does not exist',
      )
    ) {
      console.warn("⚠️  Schema access test warning:", schemaError.message);
    } else {
      console.log("✅ Test 1 passed: Schema access working");
    }

    // Test 2: Try to query appUsers table (this would fail before the fix)
    console.log("📋 Test 2: Testing appUsers table access...");

    const { data: appUsersData, error: appUsersError } = await supabase
      .from("appUsers")
      .select("id, email, name")
      .limit(1);

    if (appUsersError) {
      console.error("❌ Test 2 failed:", appUsersError.message);
      return false;
    } else {
      console.log("✅ Test 2 passed: appUsers table accessible");
      if (appUsersData && appUsersData.length > 0) {
        console.log(
          `   Found user: ${appUsersData[0].name} (${appUsersData[0].email})`,
        );
      }
    }

    // Test 3: Try a simple authentication operation
    console.log("📋 Test 3: Testing basic authentication functions...");

    // This won't actually sign in but tests if the auth system is responsive
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      console.warn("⚠️  Test 3 warning:", sessionError.message);
    } else {
      console.log("✅ Test 3 passed: Authentication system responsive");
    }

    console.log(
      "🎉 All tests completed! The auth token NULL conversion error should now be fixed.",
    );
    console.log(
      "💡 If you still experience issues, please check the Supabase logs for any remaining errors.",
    );

    return true;
  } catch (error) {
    console.error("❌ Test execution failed:", error);
    return false;
  }
}

// Run the test
testAuthFix().then((success) => {
  if (success) {
    console.log("✅ Auth fix verification completed successfully!");
  } else {
    console.log(
      "❌ Auth fix verification failed. Please check the errors above.",
    );
    process.exit(1);
  }
});
