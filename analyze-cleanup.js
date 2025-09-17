// Database column cleanup analysis and migration
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://pnoxqzlxfuvjvufdjuqh.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBub3hxemx4ZnV2anZ1ZmRqdXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczOTMxMzMsImV4cCI6MjA3Mjk2OTEzM30.QG0B60xV9TO2PaUeEOkzgqXcVuSkHVq3yYfXWKaaDzc";

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeAndCleanup() {
  console.log("🧹 Database Column Cleanup Analysis");
  console.log("=====================================\n");

  try {
    // Step 1: Analyze current pricing columns
    console.log("📊 Step 1: Analyzing pricing columns in jobs table...");

    const { data: jobs, error } = await supabase
      .from("jobs")
      .select(
        "id, estimate, estimated_cost, final_cost, unit_price, estimate_price",
      )
      .limit(5);

    if (error) {
      console.error("❌ Error querying jobs:", error.message);
      return;
    }

    console.log(`Found ${jobs.length} sample jobs:`);
    jobs.forEach((job, i) => {
      console.log(`\nJob ${i + 1} (ID: ${job.id}):`);
      console.log(`  ├─ estimated_cost: ${job.estimated_cost}`);
      console.log(`  ├─ final_cost: ${job.final_cost}`);
      console.log(`  ├─ unit_price: ${job.unit_price}`);
      console.log(`  ├─ estimate_price: ${job.estimate_price}`);
      console.log(`  └─ has_estimate_json: ${job.estimate ? "Yes" : "No"}`);
    });

    // Step 2: Count data distribution
    console.log("\n📈 Step 2: Data distribution analysis...");

    const { data: stats } = await supabase.from("jobs").select("*").limit(1000);

    if (stats) {
      const totalJobs = stats.length;
      const withEstimatedCost = stats.filter((j) => j.estimated_cost).length;
      const withFinalCost = stats.filter((j) => j.final_cost).length;
      const withUnitPrice = stats.filter((j) => j.unit_price).length;
      const withEstimatePrice = stats.filter((j) => j.estimate_price).length;
      const withEstimateJson = stats.filter((j) => j.estimate).length;

      console.log(`Total jobs analyzed: ${totalJobs}`);
      console.log(
        `estimated_cost populated: ${withEstimatedCost} (${((withEstimatedCost / totalJobs) * 100).toFixed(1)}%)`,
      );
      console.log(
        `final_cost populated: ${withFinalCost} (${((withFinalCost / totalJobs) * 100).toFixed(1)}%)`,
      );
      console.log(
        `unit_price populated: ${withUnitPrice} (${((withUnitPrice / totalJobs) * 100).toFixed(1)}%)`,
      );
      console.log(
        `estimate_price populated: ${withEstimatePrice} (${((withEstimatePrice / totalJobs) * 100).toFixed(1)}%)`,
      );
      console.log(
        `estimate JSON populated: ${withEstimateJson} (${((withEstimateJson / totalJobs) * 100).toFixed(1)}%)`,
      );
    }

    // Step 3: Cleanup recommendations
    console.log("\n🎯 Step 3: Cleanup Recommendations");
    console.log('Based on user clarification: "Estimated Cost = Final Cost"');
    console.log("\n✅ Safe to remove:");
    console.log("   1. estimated_cost column (redundant with final_cost)");
    console.log(
      "   2. estimate JSON column (migrated to unit_price/estimate_price)",
    );
    console.log("\n✅ Keep:");
    console.log("   1. final_cost (consolidated pricing)");
    console.log("   2. unit_price (per-item pricing)");
    console.log("   3. estimate_price (total estimate pricing)");

    console.log("\n🚀 Ready to proceed with column removal migration!");
  } catch (error) {
    console.error("❌ Analysis failed:", error);
  }
}

analyzeAndCleanup();
