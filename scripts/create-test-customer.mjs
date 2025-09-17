import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("🧪 Create Test Customer Script");
console.log("============================");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase configuration");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestCustomer() {
  console.log("🔍 Creating test customer...\n");

  try {
    // Generate a unique business name
    const timestamp = new Date().getTime();
    const testCustomer = {
      id: uuidv4(),
      human_id: `CUST-${timestamp}`,
      business_name: `Test Customer ${timestamp}`,
      contact_person: "Test Contact",
      email: `test${timestamp}@example.com`,
      phone: "+1-555-123-4567",
      address: "123 Test Street",
      city: "Test City",
      state: "TS",
      zip_code: "12345",
      customer_status: "active",
      customer_type: "business",
    };

    console.log("Creating customer with data:", testCustomer);

    const { data, error } = await supabase
      .from("customers")
      .insert(testCustomer)
      .select();

    if (error) {
      console.log("❌ Failed to create customer:", error.message);
      console.log("Code:", error.code);
      console.log("Details:", error.details);
      return;
    }

    console.log("✅ Customer created successfully!");
    console.log("Customer ID:", data[0].id);
    console.log("Business Name:", data[0].business_name);

    // Now test retrieving the customer
    console.log("\n🔍 Testing customer retrieval...");
    const { data: retrievedCustomer, error: retrieveError } = await supabase
      .from("customers")
      .select("*")
      .eq("id", data[0].id)
      .single();

    if (retrieveError) {
      console.log("❌ Failed to retrieve customer:", retrieveError.message);
      return;
    }

    console.log("✅ Customer retrieved successfully!");
    console.log("Business Name:", retrievedCustomer.business_name);
    console.log("Contact Person:", retrievedCustomer.contact_person);
    console.log("Email:", retrievedCustomer.email);

    // Clean up - delete the test customer
    console.log("\n🧹 Cleaning up test customer...");
    const { error: deleteError } = await supabase
      .from("customers")
      .delete()
      .eq("id", data[0].id);

    if (deleteError) {
      console.log("⚠️  Failed to delete test customer:", deleteError.message);
    } else {
      console.log("✅ Test customer deleted successfully!");
    }

    console.log("\n🎉 Customer creation test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
    console.error("Stack:", error.stack);
  }
}

createTestCustomer();
