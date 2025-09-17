const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixJobCounter() {
  console.log("🔧 Fixing job counter to start from 112...");

  try {
    // First, check current counter value
    const { data: currentCounter, error: fetchError } = await supabase
      .from("counters")
      .select("*")
      .eq("counter_id", "job")
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("❌ Error fetching current counter:", fetchError);
      return;
    }

    console.log("📊 Current counter state:", currentCounter);

    // Set counter to 112 so next number will be 113
    const { data: updatedCounter, error: updateError } = await supabase
      .from("counters")
      .upsert({
        counter_id: "job",
        last: 112,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (updateError) {
      console.error("❌ Error updating counter:", updateError);
      return;
    }

    console.log("✅ Counter updated successfully:", updatedCounter);

    // Test the counter function
    const { data: nextJobNumber, error: testError } = await supabase.rpc(
      "get_next_counter",
      { counter_name: "job" },
    );

    if (testError) {
      console.error("❌ Error testing counter function:", testError);
      return;
    }

    const formattedJobNumber = `JKDP-JOB-${String(nextJobNumber).padStart(4, "0")}`;
    console.log("🎯 Next job number will be:", formattedJobNumber);

    console.log("🎉 Job counter fixed! Next job will be numbered 113.");
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

fixJobCounter();
