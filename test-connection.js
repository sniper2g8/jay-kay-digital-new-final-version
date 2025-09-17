// Basic Supabase connection test script
const { createClient } = require("@supabase/supabase-js");

// Hard-coded values for testing (replace with your actual values)
const supabaseUrl = "https://pnoxqzlxfuvjvufdjuqh.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBub3hxemx4ZnV2anZ1ZmRqdXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczOTMxMzMsImV4cCI6MjA3Mjk2OTEzM30.QG0B60xV9TO2PaUeEOkzgqXcVuSkHVq3yYfXWKaaDzc";

console.log("Testing basic Supabase connection...");
console.log("URL:", supabaseUrl);
console.log("Key first 20 chars:", supabaseKey?.substring(0, 20) + "...");

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

async function testConnection() {
  try {
    // Test 1: Try to query a system table or use a simpler approach
    console.log("\n1. Testing basic auth/connection...");

    // First, try to get the current user/session info
    const { data: session, error: sessionError } =
      await supabase.auth.getSession();
    console.log(
      "Session check:",
      sessionError ? "Error: " + sessionError.message : "OK",
    );
    console.log("Current user:", session?.user ? "Authenticated" : "Anonymous");

    // Test 2: Try a very basic query that should work with anonymous access
    console.log("\n2. Testing if we can query any table...");

    // Try to list tables by querying the information schema
    const { data: tablesData, error: tablesError } = await supabase
      .rpc("get_schema_info")
      .select();

    console.log(
      "Schema query result:",
      tablesError ? "Error: " + tablesError.message : "Success",
    );

    // Test 3: Try customers table with more explicit error handling
    console.log("\n3. Testing customers table access...");

    try {
      const {
        data: customers,
        error: customersError,
        status,
        statusText,
      } = await supabase.from("customers").select("customer_human_id").limit(1);

      console.log("Query status:", status, statusText);

      if (customersError) {
        console.error("Customers table error:");
        console.error("- Message:", customersError.message || "No message");
        console.error("- Code:", customersError.code || "No code");
        console.error("- Details:", customersError.details || "No details");
        console.error("- Hint:", customersError.hint || "No hint");

        // Check if it's an RLS issue
        if (
          customersError.message &&
          customersError.message.includes("row level security")
        ) {
          console.log(
            "*** This appears to be a Row Level Security (RLS) issue ***",
          );
          console.log(
            "*** The customers table has RLS enabled but no policies allow anonymous access ***",
          );
        }

        return;
      }

      console.log("Customers query successful!");
      console.log("Records found:", customers?.length || 0);
    } catch (queryErr) {
      console.error("Exception during customers query:", queryErr);
    }
  } catch (err) {
    console.error("General exception:", err);
  }
}

testConnection();
