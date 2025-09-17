const { createClient } = require("@supabase/supabase-js");

// Use the correct anon key
const supabaseUrl = "https://pnoxqzlxfuvjvufdjuqh.supabase.co";
const supabaseAnonKey = "sb_publishable_aHCVwZ2OAJSAgW7Y447X6Q_vb5mG2xw";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthEndpoint() {
  console.log("🧪 Testing Supabase auth endpoint...\n");

  try {
    // Test 1: Check if we can reach the auth endpoint
    console.log("1. Testing auth endpoint connectivity...");

    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("❌ Auth endpoint error:", error.message);
    } else {
      console.log("✅ Auth endpoint reachable");
      console.log("Current session:", data.session ? "Active" : "None");
    }

    // Test 2: Try to sign in with one of the actual emails from appUsers
    console.log("\n2. Testing sign in with known email...");

    // Use one of the emails we found in appUsers table
    const testEmail = "bakadieinvestments2020@gmail.com";
    const testPassword = "password123"; // This is likely wrong, but let's see the error

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

    if (authError) {
      console.log("Auth error details:");
      console.log("- Message:", authError.message);
      console.log("- Status:", authError.status);
      console.log("- Code:", authError.code || "No code");

      if (authError.status === 500) {
        console.log("❌ HTTP 500 - This is a server error, not credentials!");
        console.log("This suggests a Supabase configuration issue.");
      } else if (authError.status === 400) {
        console.log(
          "✅ HTTP 400 - Auth endpoint working, just wrong credentials",
        );
      }
    } else {
      console.log("✅ Unexpected: Login succeeded!");
      console.log("User:", authData.user?.email);
    }

    // Test 3: Check auth configuration
    console.log("\n3. Testing auth configuration...");
    console.log("Supabase URL:", supabaseUrl);
    console.log("Anon key prefix:", supabaseAnonKey.substring(0, 20) + "...");
  } catch (error) {
    console.error("❌ Test failed with exception:", error.message);
    console.error("Stack:", error.stack);
  }
}

testAuthEndpoint().catch(console.error);
