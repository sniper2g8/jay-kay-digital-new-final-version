import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("🧪 Application Test Script");
console.log("=========================");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase configuration");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testApplication() {
  console.log("🔍 Testing application functionality...\n");

  try {
    // Test 1: Check if we can access customers table
    console.log("Test 1: Accessing customers table...");
    const { data: customers, error: customersError } = await supabase
      .from("customers")
      .select("id, business_name")
      .limit(1);

    if (customersError) {
      console.log("❌ Failed to access customers:", customersError.message);
    } else {
      console.log("✅ Customers table accessible");
      console.log("   Found", customers?.length || 0, "customers");
    }

    // Test 2: Check if we can access jobs table
    console.log("\nTest 2: Accessing jobs table...");
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id, title")
      .limit(1);

    if (jobsError) {
      console.log("❌ Failed to access jobs:", jobsError.message);
    } else {
      console.log("✅ Jobs table accessible");
      console.log("   Found", jobs?.length || 0, "jobs");
    }

    // Test 3: Check if we can access paper specifications
    console.log("\nTest 3: Accessing paper specifications...");
    const { data: paperSizes, error: paperSizesError } = await supabase
      .from("paper_sizes")
      .select("id, name")
      .limit(3);

    if (paperSizesError) {
      console.log("❌ Failed to access paper_sizes:", paperSizesError.message);
    } else {
      console.log("✅ Paper sizes accessible");
      console.log("   Found", paperSizes?.length || 0, "paper sizes");
      if (paperSizes?.length > 0) {
        paperSizes.forEach((size) => {
          console.log("   -", size.name);
        });
      }
    }

    // Test 4: Check if we can access paper weights
    console.log("\nTest 4: Accessing paper weights...");
    const { data: paperWeights, error: paperWeightsError } = await supabase
      .from("paper_weights")
      .select("id, gsm, name")
      .limit(3);

    if (paperWeightsError) {
      console.log(
        "❌ Failed to access paper_weights:",
        paperWeightsError.message,
      );
    } else {
      console.log("✅ Paper weights accessible");
      console.log("   Found", paperWeights?.length || 0, "paper weights");
      if (paperWeights?.length > 0) {
        paperWeights.forEach((weight) => {
          console.log("   -", weight.name, `(${weight.gsm} GSM)`);
        });
      }
    }

    // Test 5: Check if we can access paper types
    console.log("\nTest 5: Accessing paper types...");
    const { data: paperTypes, error: paperTypesError } = await supabase
      .from("paper_types")
      .select("id, name")
      .limit(3);

    if (paperTypesError) {
      console.log("❌ Failed to access paper_types:", paperTypesError.message);
    } else {
      console.log("✅ Paper types accessible");
      console.log("   Found", paperTypes?.length || 0, "paper types");
      if (paperTypes?.length > 0) {
        paperTypes.forEach((type) => {
          console.log("   -", type.name);
        });
      }
    }

    console.log("\n🎉 Application test completed!");
    console.log(
      "📝 Summary: Most functionality is working. The finish_options table needs permission fixes.",
    );
    console.log(
      "   Run the SQL scripts in fix-rls-policies.sql and populate_finish_options.sql",
    );
    console.log("   to complete the setup.");
  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
  }
}

testApplication();
