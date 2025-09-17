// Script to test basic Supabase connection and run diagnostic queries
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://pnoxqzlxfuvjvufdjuqh.supabase.co";
const supabaseKey = "sb_publishable_aHCVwZ2OAJSAgW7Y447X6Q_vb5mG2xw"; // New publishable key

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

async function testBasicPermissions() {
  console.log("Testing basic database permissions...\n");

  try {
    // Test 1: Try to query information_schema (should work with basic permissions)
    console.log("1. Testing access to information_schema...");
    const { data: schemaData, error: schemaError } =
      await supabase.rpc("get_current_user");

    if (schemaError) {
      console.log("Cannot execute RPC functions:", schemaError.message);
    } else {
      console.log("RPC functions work");
    }

    // Test 2: Try a very simple query first
    console.log("\n2. Testing basic table access...");

    // Try with raw SQL using rpc if available
    console.log("\n3. Testing with direct query...");
    const { data: directData, error: directError } = await supabase
      .from("customers")
      .select("count")
      .limit(0);

    if (directError) {
      console.log("Direct query error:");
      console.log("- Code:", directError.code);
      console.log("- Message:", directError.message);
      console.log("- Details:", directError.details);
      console.log("- Hint:", directError.hint);

      // Check if it's the schema permission issue
      if (
        directError.code === "42501" &&
        directError.message.includes("schema public")
      ) {
        console.log("\n*** DIAGNOSIS: Schema Permission Issue ***");
        console.log(
          "The anon role does not have USAGE permission on the public schema.",
        );
        console.log("You need to run this SQL in your Supabase SQL Editor:");
        console.log("GRANT USAGE ON SCHEMA public TO anon;");
        console.log("GRANT SELECT ON public.customers TO anon;");
        console.log(
          "\nOr run the complete fix-anonymous-access-complete.sql script.",
        );
      }
    } else {
      console.log("Direct query successful!");
      console.log("Data:", directData);
    }
  } catch (err) {
    console.error("Unexpected error:", err.message);
  }
}

testBasicPermissions();
