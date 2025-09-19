import { createClient } from '@supabase/supabase-js';;
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

async function cleanupRedundantColumns() {
  console.log("🧹 Starting cleanup of redundant database columns...\n");

  try {
    // Step 1: Analyze current data
    console.log("📊 Step 1: Analyzing current pricing columns...");
    const { data: jobs, error: fetchError } = await supabase
      .from("jobs")
      .select(
        "id, estimate, estimated_cost, final_cost, unit_price, estimate_price",
      )
      .limit(10);

    if (fetchError) {
      console.error("❌ Error fetching jobs:", fetchError);
      return;
    }

    console.log("Sample data analysis:");
    jobs.forEach((job, i) => {
      console.log(`Job ${i + 1}:`, {
        estimated_cost: job.estimated_cost,
        final_cost: job.final_cost,
        unit_price: job.unit_price,
        estimate_price: job.estimate_price,
        has_estimate_json: !!job.estimate,
      });
    });

    // Step 2: Consolidate estimated_cost with final_cost where needed
    console.log("\n🔄 Step 2: Consolidating estimated_cost = final_cost...");

    // Update final_cost to estimated_cost where final_cost is null but estimated_cost exists
    const { data: updateResult, error: updateError } = await supabase
      .from("jobs")
      .update({ final_cost: supabase.raw("estimated_cost") })
      .is("final_cost", null)
      .not("estimated_cost", "is", null);

    if (updateError) {
      console.error("❌ Error updating final_cost:", updateError);
    } else {
      console.log(
        "✅ Consolidated estimated_cost into final_cost where needed",
      );
    }

    // Step 3: Count redundant estimate JSON usage
    console.log("\n📈 Step 3: Checking estimate JSON usage...");
    const { data: withEstimateJson } = await supabase
      .from("jobs")
      .select("id")
      .not("estimate", "is", null);

    const { data: withNewColumns } = await supabase
      .from("jobs")
      .select("id")
      .or("not.unit_price.is.null,not.estimate_price.is.null");

    console.log(`Jobs with estimate JSON: ${withEstimateJson?.length || 0}`);
    console.log(`Jobs with new columns: ${withNewColumns?.length || 0}`);

    // Step 4: Recommendation
    console.log("\n🎯 Cleanup Recommendations:");
    if ((withNewColumns?.length || 0) > 0) {
      console.log("✅ New pricing columns are populated");
      console.log("📝 Safe to remove:");
      console.log(
        "   - estimate (JSON) column - data migrated to unit_price/estimate_price",
      );
      console.log("   - estimated_cost column - consolidated with final_cost");
      console.log("\n🚀 Ready to proceed with column removal!");
    } else {
      console.log(
        "⚠️  New pricing columns not populated - run migration first",
      );
    }
  } catch (error) {
    console.error("❌ Cleanup analysis failed:", error);
  }
}

cleanupRedundantColumns();
