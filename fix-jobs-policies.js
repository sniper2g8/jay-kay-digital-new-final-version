const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

// Use the anon key since service role key seems incomplete
const supabaseUrl = "https://pnoxqzlxfuvjvufdjuqh.supabase.co";
const supabaseAnonKey = "sb_publishable_aHCVwZ2OAJSAgW7Y447X6Q_vb5mG2xw";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixJobsPolicies() {
  console.log("🔧 Testing jobs table access and policies...");

  try {
    // Test basic connection with anon access
    console.log("🔍 Testing anonymous connection...");
    const { data, error } = await supabase
      .from("jobs")
      .select("id, title, status")
      .limit(1);

    if (error) {
      console.error("❌ Anonymous access failed:", error.message);
    } else {
      console.log("✅ Anonymous read access works");
      console.log("Sample data:", data);
    }

    // Check if we can get the SQL file and suggest manual execution
    console.log("\n📋 SQL policies to be executed manually:");
    try {
      const sqlContent = fs.readFileSync("./add-auth-policies.sql", "utf8");
      console.log("\n--- COPY THIS SQL TO SUPABASE SQL EDITOR ---");
      console.log(sqlContent);
      console.log("--- END OF SQL ---\n");
    } catch (readError) {
      console.log("Could not read SQL file:", readError.message);
    }

    console.log("🔍 Please execute the above SQL in your Supabase dashboard:");
    console.log("1. Go to https://supabase.com/dashboard");
    console.log("2. Select your project: pnoxqzlxfuvjvufdjuqh");
    console.log("3. Go to SQL Editor");
    console.log("4. Copy and paste the SQL above");
    console.log('5. Click "Run" to execute');
  } catch (error) {
    console.error("❌ Error during test:", error);
  }
}

async function fixJobsPolicies() {
  console.log("� Fixing RLS policies for jobs table...");

  try {
    // Test basic connection first
    console.log("� Testing connection...");
    const { data: connectionTest, error: connectionError } = await supabase
      .from("jobs")
      .select("count")
      .limit(1);

    if (connectionError) {
      console.error("❌ Connection test failed:", connectionError.message);
      return;
    }

    console.log("✅ Connection successful");

    // Test job insertion directly
    console.log("🧪 Testing job insertion...");

    const testJob = {
      id: "test-" + Date.now(),
      jobNo: "TEST-" + Date.now(),
      title: "Test Job for Policy Verification",
      status: "pending",
      customer_id: null,
      service_id: null,
      createdBy: null,
    };

    const { data, error } = await supabase
      .from("jobs")
      .insert([testJob])
      .select()
      .single();

    if (error) {
      console.error("❌ Test insertion failed:", error.message);
      console.error("Error details:", JSON.stringify(error, null, 2));
    } else {
      console.log("✅ Test insertion successful!");
      console.log("Inserted job:", data);

      // Clean up test job
      const { error: deleteError } = await supabase
        .from("jobs")
        .delete()
        .eq("id", testJob.id);

      if (deleteError) {
        console.log("Note: Could not clean up test job:", deleteError.message);
      } else {
        console.log("🧹 Test job cleaned up");
      }
    }
  } catch (error) {
    console.error("❌ Error during policy test:", error);
  }
}

fixJobsPolicies();
