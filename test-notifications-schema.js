require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
);

async function testNotificationsSchema() {
  try {
    // Test a simple query to see the structure
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .limit(1);

    if (error) {
      console.log("Error querying notifications:", error);
    } else {
      console.log(
        "Sample notification structure:",
        JSON.stringify(data, null, 2),
      );
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

testNotificationsSchema();
