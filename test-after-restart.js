const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://pnoxqzlxfuvjvufdjuqh.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBub3hxemx4ZnV2anZ1ZmRqdXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczOTMxMzMsImV4cCI6MjA3Mjk2OTEzM30.QG0B60xV9TO2PaUeEOkzgqXcVuSkHVq3yYfXWKaaDzc";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAfterRestart() {
  console.log("🔄 Testing Authentication After Supabase Restart\n");

  // Test 1: Try login with existing user
  console.log("=== Test 1: Login with Existing User ===");
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "delsenterprise@gmail.com",
      password: "delsenterprise123",
    });

    if (error) {
      console.log("❌ Login failed:", error.message);
      console.log("Error status:", error.status);

      if (error.message.includes("converting NULL to string")) {
        console.log(
          "🚨 STILL GETTING NULL CONVERSION ERROR - Cache not cleared",
        );
      } else {
        console.log("✅ No NULL conversion error - different issue or fixed!");
      }
    } else {
      console.log("✅ Login successful!");
      console.log("User ID:", data.user?.id);
      console.log("Email:", data.user?.email);
    }
  } catch (err) {
    console.log("❌ Login exception:", err.message);
  }

  // Test 2: Quick session check
  console.log("\n=== Test 2: Session Status ===");
  try {
    const { data: session } = await supabase.auth.getSession();
    if (session?.user) {
      console.log("✅ Active session found");
      console.log("User:", session.user.email);
    } else {
      console.log("ℹ️ No active session");
    }
  } catch (err) {
    console.log("❌ Session check failed:", err.message);
  }

  console.log("\n=== Results Summary ===");
  console.log("If login works: ✅ Cache clearing fixed the issue!");
  console.log("If still fails: 🔧 Need to investigate other causes");
  console.log("Check the browser login too after running this test.");
}

testAfterRestart().catch(console.error);
