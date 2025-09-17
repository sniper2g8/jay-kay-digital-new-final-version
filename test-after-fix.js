const { createClient } = require("@supabase/supabase-js");

// Use environment variables
const supabaseUrl = "https://pnoxqzlxfuvjvufdjuqh.supabase.co";
const supabaseAnonKey = "sb_publishable_aHCVwZ2OAJSAgW7Y447X6Q_vb5mG2xw";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testJobCreation() {
  console.log("🧪 Testing job creation after RLS policy fix...");

  try {
    // First, test if we can authenticate
    console.log("🔐 Testing authentication...");

    // For this test, we'll need an actual user session
    // In a real app, you'd sign in first
    console.log("Note: This test requires an authenticated user session");
    console.log("The job submission should work when:");
    console.log(
      "1. ✅ RLS policies are applied (run the SQL in Supabase dashboard)",
    );
    console.log("2. ✅ User is logged in through the app");
    console.log("3. ✅ All required fields are filled");

    // Test basic read access
    console.log("\n🔍 Testing read access...");
    const { data: jobs, error: readError } = await supabase
      .from("jobs")
      .select("id, title, status")
      .limit(3);

    if (readError) {
      console.error("❌ Read access failed:", readError.message);
    } else {
      console.log("✅ Read access successful");
      console.log(`Found ${jobs.length} jobs`);
    }

    // Test customers table
    const { data: customers, error: customersError } = await supabase
      .from("customers")
      .select("id, business_name")
      .limit(3);

    if (customersError) {
      console.error("❌ Customers read failed:", customersError.message);
    } else {
      console.log("✅ Customers read successful");
      console.log(`Found ${customers.length} customers`);
    }

    // Test services table
    const { data: services, error: servicesError } = await supabase
      .from("services")
      .select("id, title")
      .limit(3);

    if (servicesError) {
      console.error("❌ Services read failed:", servicesError.message);
    } else {
      console.log("✅ Services read successful");
      console.log(`Found ${services.length} services`);
    }

    console.log("\n🎯 To complete the test:");
    console.log("1. Apply the SQL policies in Supabase dashboard");
    console.log("2. Log in to the application");
    console.log("3. Try submitting a job through the UI");
    console.log("4. Check for any console errors");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testJobCreation();
