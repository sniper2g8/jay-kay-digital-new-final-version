// Test script to verify login permissions are fixed
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://pnoxqzlxfuvjvufdjuqh.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBub3hxemx4ZnV2anZ1ZmRqdXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczOTMxMzMsImV4cCI6MjA3Mjk2OTEzM30.QG0B60xV9TO2PaUeEOkzgqXcVuSkHVq3yYfXWKaaDzc";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLoginFlow() {
  console.log("🔧 Testing login permissions fix...\n");

  try {
    // Test 1: Verify appUsers table access (this was failing before)
    console.log("1. Testing appUsers table access...");
    const { data: appUsersTest, error: appUsersError } = await supabase
      .from("appUsers")
      .select("count(*)")
      .limit(1);

    if (appUsersError) {
      console.error("❌ appUsers access still failing:", appUsersError.message);
      console.error("   Code:", appUsersError.code);

      if (appUsersError.code === "42501") {
        console.log(
          "💡 Need to run fix-login-permissions.sql in Supabase dashboard",
        );
        return false;
      }
    } else {
      console.log("✅ appUsers table accessible");
    }

    // Test 2: Test the exact query used in useUserRole hook
    console.log("\n2. Testing useUserRole query structure...");
    const { data: roleQuery, error: roleError } = await supabase
      .from("appUsers")
      .select("id, email, name, primary_role, human_id, status")
      .eq("id", "test-id")
      .single();

    if (roleError) {
      if (roleError.code === "PGRST116") {
        console.log(
          "✅ useUserRole query structure works (no matching user found - expected)",
        );
      } else {
        console.error("❌ useUserRole query failed:", roleError.message);
        return false;
      }
    } else {
      console.log("✅ useUserRole query works (found test user)");
    }

    // Test 3: Test related tables that might be needed during login
    console.log("\n3. Testing related authentication tables...");

    const tables = ["roles", "permissions"];
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select("count(*)")
          .limit(1);

        if (error) {
          console.log(`⚠️  ${table} table: ${error.message}`);
        } else {
          console.log(`✅ ${table} table accessible`);
        }
      } catch (e) {
        console.log(`⚠️  ${table} table: not accessible`);
      }
    }

    console.log("\n🎉 Login permissions test completed!");
    console.log(
      "📝 If all tests pass, login should work without database errors.",
    );

    return true;
  } catch (err) {
    console.error("❌ General error during test:", err);
    return false;
  }
}

// Also test a simulated login flow
async function simulateLoginFlow() {
  console.log("\n🔐 Simulating actual login flow...\n");

  try {
    // Step 1: Simulate successful authentication
    console.log("1. User authentication: ✅ (simulated)");

    // Step 2: This is where the real app would call useUserRole
    console.log("2. Calling useUserRole hook equivalent...");

    const simulatedUserId = "12345678-1234-1234-1234-123456789012"; // Valid UUID format

    const { data: userRole, error: userRoleError } = await supabase
      .from("appUsers")
      .select("id, email, name, primary_role, human_id, status")
      .eq("id", simulatedUserId)
      .single();

    if (userRoleError) {
      if (userRoleError.code === "PGRST116") {
        console.log(
          "✅ useUserRole query works (user not found - normal for test)",
        );
        console.log("3. Login flow would continue normally");
      } else {
        console.error("❌ useUserRole failed - this would break login!");
        console.error("   Error:", userRoleError.message);
        console.log("💡 This is the exact error users see during login");
        return false;
      }
    } else {
      console.log("✅ useUserRole query successful");
      console.log("3. Login flow would complete successfully");
    }

    console.log("\n🎉 Simulated login flow completed without database errors!");
    return true;
  } catch (err) {
    console.error("❌ Login simulation failed:", err);
    return false;
  }
}

// Run both tests
async function runAllTests() {
  const permissionsOk = await testLoginFlow();
  if (permissionsOk) {
    await simulateLoginFlow();
  }

  console.log("\n📋 Summary:");
  console.log("- If tests pass: Login should work");
  console.log("- If tests fail: Run fix-login-permissions.sql in Supabase");
  console.log("- File location: ./fix-login-permissions.sql");
}

runAllTests();
