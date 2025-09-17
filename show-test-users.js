// Show available test users for authentication
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

async function showTestUsers() {
  try {
    console.log("👥 Available users for authentication testing:");
    console.log("==============================================");

    const { data: users, error } = await supabase
      .from("appUsers")
      .select("email, name, primary_role")
      .order("primary_role");

    if (error) {
      console.log("❌ Error:", error.message);
      return;
    }

    users?.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.primary_role}`);
      console.log("");
    });

    console.log("🔑 To test login:");
    console.log("1. Go to: http://localhost:3000/auth/login");
    console.log("2. Use any of the emails above");
    console.log("3. Password should be set in Supabase Auth");
    console.log("");
    console.log("💡 If you need to set/reset passwords:");
    console.log("1. Go to Supabase Dashboard > Authentication > Users");
    console.log("2. Find the user and reset their password");
    console.log("3. Or create a new test user");
  } catch (err) {
    console.error("💥 Error:", err.message);
  }
}

showTestUsers();
