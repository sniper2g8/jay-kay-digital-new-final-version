// Test login query on appUsers table
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://pnoxqzlxfuvjvufdjuqh.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBub3hxemx4ZnV2anZ1ZmRqdXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczOTMxMzMsImV4cCI6MjA3Mjk2OTEzM30.QG0B60xV9TO2PaUeEOkzgqXcVuSkHVq3yYfXWKaaDzc";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAppUsersQuery() {
  try {
    console.log("Testing appUsers table query (login-related)...\n");

    // Test 1: Check if appUsers table exists and what columns it has
    console.log("1. Testing appUsers table access...");
    const {
      data: appUsers,
      error: appUsersError,
      status,
    } = await supabase.from("appUsers").select("*").limit(1);

    console.log("Query status:", status);

    if (appUsersError) {
      console.error("appUsers table error:");
      console.error("- Message:", appUsersError.message);
      console.error("- Code:", appUsersError.code);
      console.error("- Details:", appUsersError.details);
      console.error("- Hint:", appUsersError.hint);

      if (appUsersError.message.includes("does not exist")) {
        console.log("\n*** appUsers table does not exist! ***");
        console.log("Checking for alternative table names...");

        // Try common variations
        const variations = ["app_users", "users", "user_profiles", "profiles"];
        for (const tableName of variations) {
          try {
            const { data, error } = await supabase
              .from(tableName)
              .select("*")
              .limit(1);

            if (!error && data) {
              console.log(`✓ Found alternative table: ${tableName}`);
              console.log("Schema:", Object.keys(data[0] || {}));
              break;
            }
          } catch (e) {
            // Ignore
          }
        }
      }

      return;
    }

    console.log("✓ appUsers table accessible!");
    if (appUsers && appUsers.length > 0) {
      console.log("Sample record structure:");
      console.log(JSON.stringify(appUsers[0], null, 2));
      console.log("\nAvailable columns:", Object.keys(appUsers[0]));
    } else {
      console.log("Table is empty, checking schema with INSERT attempt...");

      // Try to see what columns exist by attempting a minimal select
      const { data: schemaTest, error: schemaError } = await supabase
        .from("appUsers")
        .select("id, email, primary_role, status")
        .limit(1);

      if (schemaError) {
        console.error("Schema test error:", schemaError.message);

        // Check which specific column is causing issues
        const columnTests = [
          "id",
          "email",
          "primary_role",
          "status",
          "human_id",
          "name",
        ];
        console.log("\nTesting individual columns:");

        for (const column of columnTests) {
          try {
            const { error: colError } = await supabase
              .from("appUsers")
              .select(column)
              .limit(1);

            if (colError) {
              console.log(`✗ ${column}: ${colError.message}`);
            } else {
              console.log(`✓ ${column}: exists`);
            }
          } catch (e) {
            console.log(`✗ ${column}: exception`);
          }
        }
      } else {
        console.log("✓ Core columns exist but table is empty");
      }
    }

    // Test 2: Simulate the actual login query from useUserRole hook
    console.log("\n2. Testing the exact query used in useUserRole hook...");

    // This is the query from fetchUserRole function
    const testUserId = "test-user-id"; // This would normally come from auth
    const { data: userRole, error: roleError } = await supabase
      .from("appUsers")
      .select("id, email, name, primary_role, human_id, status")
      .eq("id", testUserId)
      .single();

    if (roleError) {
      console.error("Role query error:", roleError.message);
      console.error("Code:", roleError.code);

      if (roleError.code === "PGRST116") {
        console.log("✓ Query structure is valid (no matching records found)");
      } else {
        console.log(
          "✗ Query structure issue - this is likely the login problem!",
        );
      }
    } else {
      console.log("✓ Role query successful (found user)");
    }

    // Test 3: Check RLS policies
    console.log(
      "\n3. Testing RLS policies for authenticated vs anonymous access...",
    );

    const { data: anonAccess, error: anonError } = await supabase
      .from("appUsers")
      .select("count(*)")
      .limit(1);

    if (anonError) {
      console.error("Anonymous access blocked:", anonError.message);
      console.log(
        "This suggests RLS is active - users need to be authenticated to query appUsers",
      );
    } else {
      console.log("✓ Anonymous access allowed to appUsers table");
    }
  } catch (err) {
    console.error("General exception:", err);
  }
}

testAppUsersQuery();
