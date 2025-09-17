const { createClient } = require("@supabase/supabase-js");

// Use correct API keys
const supabaseUrl = "https://pnoxqzlxfuvjvufdjuqh.supabase.co";
const supabaseServiceKey = "sb_secret_7EUpLaZ4js5KRZL_hvCwDQ_O2az_bot"; // Service role for admin access

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAuthUsers() {
  console.log("🔍 Checking auth.users table...\n");

  try {
    // Using service role to check actual auth users
    const { data: authUsers, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error("❌ Error fetching auth users:", error.message);
      return;
    }

    console.log(`Found ${authUsers.users.length} users in auth.users table:`);

    authUsers.users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(
        `   Email confirmed: ${user.email_confirmed_at ? "Yes" : "No"}`,
      );
      console.log(`   Last sign in: ${user.last_sign_in_at || "Never"}`);
      console.log("");
    });

    // Check if appUsers matches auth.users
    console.log("🔗 Checking appUsers vs auth.users alignment...\n");

    const { data: appUsers, error: appError } = await supabase
      .from("appUsers")
      .select("id, email, name, primary_role, status");

    if (appError) {
      console.error("❌ Error fetching appUsers:", appError.message);
      return;
    }

    console.log("AppUsers table:");
    appUsers.forEach((user) => {
      const authUser = authUsers.users.find((au) => au.id === user.id);
      console.log(
        `- ${user.email} (${user.primary_role}) ${authUser ? "✅ Has auth record" : "❌ No auth record"}`,
      );
    });
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

checkAuthUsers().catch(console.error);
