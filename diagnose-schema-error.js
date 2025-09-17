const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://pnoxqzlxfuvjvufdjuqh.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBub3hxemx4ZnV2anZ1ZmRqdXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczOTMxMzMsImV4cCI6MjA3Mjk2OTEzM30.QG0B60xV9TO2PaUeEOkzgqXcVuSkHVq3yYfXWKaaDzc";

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseSchemaError() {
  console.log("🔍 Diagnosing Schema Error\n");

  // Test 1: Try a simple database query
  console.log("=== Test 1: Basic Database Query ===");
  try {
    const { data, error } = await supabase
      .from("appUsers")
      .select("id, email")
      .limit(1);

    if (error) {
      console.log("❌ Database query failed:", error.message);
      console.log("Error details:", error);
    } else {
      console.log("✅ Database query successful");
      console.log("Records found:", data?.length || 0);
    }
  } catch (err) {
    console.log("❌ Database query exception:", err.message);
  }

  // Test 2: Try signup instead of login
  console.log("\n=== Test 2: New User Signup ===");
  const testEmail = `test-${Date.now()}@example.com`;

  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: "TestPassword123!",
    });

    if (error) {
      console.log("❌ Signup failed:", error.message);
      console.log("Error status:", error.status);
    } else {
      console.log("✅ Signup successful!");
      console.log("User created:", data.user?.email);
    }
  } catch (err) {
    console.log("❌ Signup exception:", err.message);
  }

  // Test 3: Check if it's a user-specific issue
  console.log("\n=== Test 3: Try Different Existing User ===");
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "test@example.com", // Different user
      password: "wrongpassword", // Wrong password on purpose
    });

    if (error) {
      console.log("Error type:", error.message);
      if (error.message.includes("Invalid login credentials")) {
        console.log("✅ Auth service working - just wrong credentials");
      } else if (error.message.includes("Database error")) {
        console.log("❌ Same database error with different user");
      }
    }
  } catch (err) {
    console.log("❌ Test login exception:", err.message);
  }

  console.log("\n=== Analysis ===");
  console.log("The main NULL conversion issue is FIXED! 🎉");
  console.log(
    'Now investigating this new "Database error querying schema" issue.',
  );
}

diagnoseSchemaError().catch(console.error);
