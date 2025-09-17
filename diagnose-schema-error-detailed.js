const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://pnoxqzlxfuvjvufdjuqh.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBub3hxemx4ZnV2anZ1ZmRqdXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczOTMxMzMsImV4cCI6MjA3Mjk2OTEzM30.QG0B60xV9TO2PaUeEOkzgqXcVuSkHVq3yYfXWKaaDzc";

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseDatabaseError() {
  console.log('🔍 Diagnosing "Database error querying schema" Issue\n');

  // Test 1: Check if basic database connection works
  console.log("=== Test 1: Basic Database Connection ===");
  try {
    const { data, error } = await supabase
      .from("appUsers")
      .select("count")
      .single();

    if (error) {
      console.log("❌ appUsers query failed:", error.message);
      console.log("Error code:", error.code);
      console.log("Error details:", error.details);
    } else {
      console.log("✅ Basic query works");
    }
  } catch (err) {
    console.log("❌ Exception:", err.message);
  }

  // Test 2: Try different table name variations
  console.log("\n=== Test 2: Table Name Variations ===");
  const tableVariations = [
    "appUsers",
    '"appUsers"',
    "public.appUsers",
    'public."appUsers"',
  ];

  for (const tableName of tableVariations) {
    try {
      console.log(`Testing: ${tableName}`);
      // We'll use a raw query since .from() might not handle quoted names well
      const { data, error } = await supabase.rpc("exec_sql", {
        sql: `SELECT COUNT(*) as count FROM ${tableName} LIMIT 1`,
      });

      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ ${tableName}: Works!`);
      }
    } catch (err) {
      console.log(`❌ ${tableName}: Exception - ${err.message}`);
    }
  }

  // Test 3: Check what happens during actual auth flow
  console.log("\n=== Test 3: Simulate Auth Flow ===");
  try {
    console.log("Step 1: Attempting signup...");
    const testEmail = `test-${Date.now()}@example.com`;

    const { data: signupData, error: signupError } = await supabase.auth.signUp(
      {
        email: testEmail,
        password: "TestPassword123!",
      },
    );

    if (signupError) {
      console.log("❌ Signup failed:", signupError.message);
      console.log("Error status:", signupError.status);

      // Check if it's the schema error
      if (signupError.message.includes("querying schema")) {
        console.log("🚨 SCHEMA ERROR CONFIRMED during signup");
        console.log(
          "This suggests Supabase is trying to query a table/view that has issues",
        );
      }
    } else {
      console.log("✅ Signup successful:", signupData.user?.email);

      // If signup worked, try to query user data
      console.log("Step 2: Attempting to query user profile...");
      const { data: userData, error: userError } = await supabase
        .from("appUsers")
        .select("*")
        .eq("email", testEmail)
        .single();

      if (userError) {
        console.log("❌ User profile query failed:", userError.message);
      } else {
        console.log("✅ User profile found:", userData?.email);
      }
    }
  } catch (err) {
    console.log("❌ Auth flow exception:", err.message);
  }

  // Test 4: Check if there are any database functions that might be failing
  console.log("\n=== Test 4: Check Database Functions ===");
  try {
    const { data, error } = await supabase.rpc("version");
    if (error) {
      console.log("❌ Database function call failed:", error.message);
    } else {
      console.log("✅ Database functions working");
    }
  } catch (err) {
    console.log("❌ Function test exception:", err.message);
  }

  console.log("\n=== Diagnosis Summary ===");
  console.log('The "Database error querying schema" could be caused by:');
  console.log("1. Table name case sensitivity issues (appUsers vs appusers)");
  console.log("2. Missing or corrupted database views");
  console.log("3. RLS policies blocking system queries");
  console.log("4. Database trigger failures during user creation");
  console.log("5. Supabase internal schema cache issues");
}

diagnoseDatabaseError().catch(console.error);
