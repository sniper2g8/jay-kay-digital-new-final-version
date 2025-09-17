const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

async function analyzeRedundantColumns() {
  console.log("🔍 Analyzing redundant columns in jobs table...\n");

  try {
    // Get jobs with all pricing-related columns
    const { data: jobs, error } = await supabase
      .from("jobs")
      .select(
        "id, estimate, estimated_cost, final_cost, unit_price, estimate_price",
      )
      .limit(50);

    if (error) {
      console.error("❌ Error fetching jobs:", error);
      return;
    }

    console.log(`📊 Analyzed ${jobs.length} jobs:\n`);

    // Count data availability
    let estimateJsonCount = 0;
    let estimatedCostCount = 0;
    let finalCostCount = 0;
    let unitPriceCount = 0;
    let estimatePriceCount = 0;

    jobs.forEach((job) => {
      if (job.estimate) estimateJsonCount++;
      if (job.estimated_cost) estimatedCostCount++;
      if (job.final_cost) finalCostCount++;
      if (job.unit_price) unitPriceCount++;
      if (job.estimate_price) estimatePriceCount++;
    });

    console.log("Column Usage Analysis:");
    console.log(
      `├─ estimate (JSON): ${estimateJsonCount}/${jobs.length} (${((estimateJsonCount / jobs.length) * 100).toFixed(1)}%)`,
    );
    console.log(
      `├─ estimated_cost: ${estimatedCostCount}/${jobs.length} (${((estimatedCostCount / jobs.length) * 100).toFixed(1)}%)`,
    );
    console.log(
      `├─ final_cost: ${finalCostCount}/${jobs.length} (${((finalCostCount / jobs.length) * 100).toFixed(1)}%)`,
    );
    console.log(
      `├─ unit_price (NEW): ${unitPriceCount}/${jobs.length} (${((unitPriceCount / jobs.length) * 100).toFixed(1)}%)`,
    );
    console.log(
      `└─ estimate_price (NEW): ${estimatePriceCount}/${jobs.length} (${((estimatePriceCount / jobs.length) * 100).toFixed(1)}%)\n`,
    );

    // Recommendation
    console.log("🎯 Recommendations:");
    if (unitPriceCount > 0 && estimatePriceCount > 0) {
      console.log(
        "✅ New pricing columns are populated - safe to remove redundant columns",
      );
      console.log("📝 Can safely remove:");
      console.log("   - estimate (JSON) - data migrated to structured columns");
      if (estimatedCostCount === 0) {
        console.log(
          "   - estimated_cost - no data or replaced by estimate_price",
        );
      }
    } else {
      console.log(
        "⚠️  New pricing columns not fully populated - migration needed first",
      );
    }
  } catch (error) {
    console.error("❌ Analysis failed:", error);
  }
}

analyzeRedundantColumns();
