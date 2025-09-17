const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://pnoxqzlxfuvjvufdjuqh.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBub3hxemx4ZnV2anZ1ZmRqdXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczOTMxMzMsImV4cCI6MjA3Mjk2OTEzM30.QG0B60xV9TO2PaUeEOkzgqXcVuSkHVq3yYfXWKaaDzc";

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeThreeTables() {
  console.log(
    "📊 Complete Analysis of appUsers, profiles, and customers Tables\n",
  );

  // 1. Check appUsers table
  console.log("=== 1. appUsers Table ===");
  try {
    const { data: appUsers, error } = await supabase
      .from("appUsers")
      .select("id, email, name, primary_role, human_id, status, created_at")
      .limit(5);

    if (error) {
      console.log("❌ appUsers error:", error.message);
    } else {
      console.log(`✅ appUsers table: ${appUsers.length} records`);
      appUsers.forEach((u) => {
        console.log(
          `  - ${u.email} | ${u.name} | ${u.primary_role} | ${u.human_id}`,
        );
      });
    }
  } catch (err) {
    console.log("❌ appUsers exception:", err.message);
  }

  // 2. Check profiles table
  console.log("\n=== 2. profiles Table ===");
  try {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, created_at")
      .limit(5);

    if (error) {
      console.log("❌ profiles error:", error.message);
    } else {
      console.log(`✅ profiles table: ${profiles.length} records`);
      profiles.forEach((p) => {
        console.log(`  - ${p.email} | ${p.full_name} | ${p.id}`);
      });
    }
  } catch (err) {
    console.log("❌ profiles exception:", err.message);
  }

  // 3. Check customers table
  console.log("\n=== 3. customers Table ===");
  try {
    const { data: customers, error } = await supabase
      .from("customers")
      .select("id, email, business_name, contact_person, human_id, status")
      .limit(5);

    if (error) {
      console.log("❌ customers error:", error.message);
    } else {
      console.log(`✅ customers table: ${customers.length} records`);
      customers.forEach((c) => {
        console.log(
          `  - ${c.email || "no email"} | ${c.business_name} | ${c.contact_person || "no contact"} | ${c.human_id}`,
        );
      });
    }
  } catch (err) {
    console.log("❌ customers exception:", err.message);
  }

  // 4. Look for overlapping emails
  console.log("\n=== 4. Email Overlaps Analysis ===");
  try {
    const { data: appUsersEmails } = await supabase
      .from("appUsers")
      .select("email");
    const { data: profilesEmails } = await supabase
      .from("profiles")
      .select("email");
    const { data: customersEmails } = await supabase
      .from("customers")
      .select("email");

    const appUsersSet = new Set((appUsersEmails || []).map((u) => u.email));
    const profilesSet = new Set((profilesEmails || []).map((p) => p.email));
    const customersSet = new Set(
      (customersEmails || []).filter((c) => c.email).map((c) => c.email),
    );

    console.log(`appUsers emails: ${appUsersSet.size}`);
    console.log(`profiles emails: ${profilesSet.size}`);
    console.log(`customers emails: ${customersSet.size}`);

    // Find overlaps
    const appUsersProfilesOverlap = [...appUsersSet].filter((email) =>
      profilesSet.has(email),
    );
    const appUsersCustomersOverlap = [...appUsersSet].filter((email) =>
      customersSet.has(email),
    );

    console.log(`\nOverlaps:`);
    console.log(
      `appUsers ↔ profiles: ${appUsersProfilesOverlap.length} emails`,
    );
    console.log(
      `appUsers ↔ customers: ${appUsersCustomersOverlap.length} emails`,
    );

    if (appUsersProfilesOverlap.length > 0) {
      console.log(`Overlapping emails: ${appUsersProfilesOverlap.join(", ")}`);
    }
  } catch (err) {
    console.log("❌ Overlap analysis failed:", err.message);
  }

  console.log("\n=== 5. Summary & Issues ===");
  console.log("Current problems:");
  console.log("1. 🔄 Potential data duplication between appUsers and profiles");
  console.log("2. 🎯 Need to clarify purpose of each table");
  console.log("3. 🔧 Auth system may expect specific table structure");
  console.log("4. 📋 customers table should be separate (business entities)");

  console.log("\nRecommended structure:");
  console.log("- appUsers: Main user accounts (staff, admins, customer users)");
  console.log(
    "- profiles: View/sync of appUsers for Supabase auth compatibility",
  );
  console.log(
    "- customers: Business entities that place orders (separate from users)",
  );
}

analyzeThreeTables().catch(console.error);
