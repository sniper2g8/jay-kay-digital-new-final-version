const { createClient } = require("@supabase/supabase-js");

// Use environment variables or direct values
const supabaseUrl = "https://pnoxqzlxfuvjvufdjuqh.supabase.co";
const supabaseKey = "sb_publishable_aHCVwZ2OAJSAgW7Y447X6Q_vb5mG2xw";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthFlow() {
  console.log("🧪 Testing complete authentication flow...\n");

  try {
    // Step 1: Test basic auth without login
    console.log("1. Testing initial auth state...");
    const { data: session } = await supabase.auth.getSession();
    console.log("Session:", session?.session ? "Exists" : "None");

    // Step 2: Test appUsers query as anonymous user
    console.log("\n2. Testing appUsers query as anonymous user...");
    const { data: anonData, error: anonError } = await supabase
      .from("appUsers")
      .select("id, email, name, primary_role, human_id, status")
      .limit(1);

    if (anonError) {
      console.error("❌ Anonymous appUsers query failed:", anonError.message);
    } else {
      console.log("✅ Anonymous appUsers query works");
      console.log("Data sample:", anonData);
    }

    // Step 3: Try to sign in with test credentials
    console.log("\n3. Attempting sign in...");

    // Try with a known email from our appUsers table
    const testEmail = "john.smith@example.com"; // One of the emails we saw
    const testPassword = "testpassword123"; // This likely won't work, but let's see the error

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

    if (authError) {
      console.log("Expected auth error (test credentials):", authError.message);
      console.log("Error code:", authError.status);
      console.log("Full error:", JSON.stringify(authError, null, 2));
    } else {
      console.log("✅ Auth successful (unexpected!)");
      console.log("User ID:", authData.user?.id);

      // Step 4: Test appUsers query as authenticated user
      console.log("\n4. Testing appUsers query as authenticated user...");
      const { data: authUserData, error: authUserError } = await supabase
        .from("appUsers")
        .select("id, email, name, primary_role, human_id, status")
        .eq("id", authData.user.id)
        .single();

      if (authUserError) {
        console.error(
          "❌ Authenticated appUsers query failed:",
          authUserError.message,
        );
      } else {
        console.log("✅ Authenticated appUsers query works");
        console.log("User data:", authUserData);
      }
    }
  } catch (error) {
    console.error("❌ Test failed with exception:", error.message);
    console.error("Full error:", error);
  }
}

// Test the current RLS policies
async function testRLSPolicies() {
  console.log("\n🔒 Testing RLS policies...\n");

  try {
    // Test 1: Can we see the table structure?
    console.log("1. Testing table access...");
    const { data, error } = await supabase
      .from("appUsers")
      .select("*")
      .limit(0); // No data, just test access

    if (error) {
      console.error("❌ Table access failed:", error.message);
      console.error("Error details:", error);
    } else {
      console.log("✅ Table access successful");
    }

    // Test 2: Test specific columns
    console.log("\n2. Testing specific column access...");
    const { data: columnData, error: columnError } = await supabase
      .from("appUsers")
      .select("id, email, primary_role")
      .limit(1);

    if (columnError) {
      console.error("❌ Column access failed:", columnError.message);
    } else {
      console.log("✅ Column access successful");
      console.log("Sample data:", columnData);
    }
  } catch (error) {
    console.error("❌ RLS test failed:", error.message);
  }
}

// Main execution
async function main() {
  await testRLSPolicies();
  await testAuthFlow();
}

main().catch(console.error);
