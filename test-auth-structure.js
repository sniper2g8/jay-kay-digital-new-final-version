// Test authentication with clean database structure
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

async function testAuthentication() {
  try {
    console.log("🧪 Testing authentication with clean database structure...");

    // Test 1: Check if profiles view is accessible
    console.log("\n1️⃣ Testing profiles view accessibility...");
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .limit(1);

    if (profilesError) {
      console.log("❌ Profiles view error:", profilesError.message);
    } else {
      console.log(
        "✅ Profiles view accessible:",
        profiles?.length || 0,
        "records visible",
      );
    }

    // Test 2: Check appUsers table structure
    console.log("\n2️⃣ Testing appUsers table accessibility...");
    const { data: appUsers, error: appUsersError } = await supabase
      .from("appUsers")
      .select("id, email, name, primary_role")
      .limit(1);

    if (appUsersError) {
      console.log("❌ appUsers table error:", appUsersError.message);
    } else {
      console.log(
        "✅ appUsers table accessible:",
        appUsers?.length || 0,
        "records visible",
      );
      if (appUsers && appUsers.length > 0) {
        console.log(
          "   Sample user:",
          appUsers[0].email,
          "-",
          appUsers[0].primary_role,
        );
      }
    }

    // Test 3: Check customers table with relationships
    console.log("\n3️⃣ Testing customers table with contact_person_id...");
    const { data: customers, error: customersError } = await supabase
      .from("customers")
      .select(
        `
        business_name,
        human_id,
        contact_person_id,
        appUsers:contact_person_id (
          name,
          email,
          primary_role
        )
      `,
      )
      .limit(3);

    if (customersError) {
      console.log("❌ Customers relationship error:", customersError.message);
    } else {
      console.log(
        "✅ Customers with relationships:",
        customers?.length || 0,
        "records",
      );
      customers?.forEach((customer) => {
        const contact = customer.appUsers;
        console.log(
          `   ${customer.business_name} -> Contact: ${contact?.name || "None"} (${contact?.email || "N/A"})`,
        );
      });
    }

    // Test 4: Check auth.users table access (should be restricted)
    console.log("\n4️⃣ Testing auth.users access (should be restricted)...");
    const { data: authUsers, error: authError } = await supabase
      .from("users")
      .select("*")
      .limit(1);

    if (authError) {
      console.log(
        "✅ Auth users table properly restricted:",
        authError.message,
      );
    } else {
      console.log("⚠️  Auth users table accessible (unexpected)");
    }

    console.log("\n🎯 Database structure test completed!");
    console.log("\nNext: Try logging in through the web interface at:");
    console.log("http://localhost:3000/auth/login");
  } catch (err) {
    console.error("💥 Test error:", err.message);
  }
}

testAuthentication();
