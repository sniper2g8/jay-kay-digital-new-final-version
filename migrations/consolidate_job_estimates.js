const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Use direct PostgreSQL connection from DATABASE_URL
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * Analyze Job Estimate Fields
 * 
 * This script analyzes pricing information across different fields:
 * - estimated_cost (numeric)
 * - final_cost (numeric) 
 * - estimate (JSON field that may contain pricing breakdowns)
 * 
 * Goal: Analyze the data structure and create improved statistics logic
 */

async function consolidateJobEstimates() {
  console.log('🔍 Starting job estimates analysis...');
  
  try {
    // Connect to PostgreSQL
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');
    
    // 1. Get all jobs with their estimate fields
    console.log('📊 Fetching all jobs...');
    const jobsQuery = `
      SELECT id, "jobNo", estimated_cost, final_cost, estimate, quantity, status
      FROM jobs 
      ORDER BY created_at ASC
    `;
    
    const jobsResult = await client.query(jobsQuery);
    const jobs = jobsResult.rows;
    
    console.log(`📋 Found ${jobs.length} jobs to analyze`);
    
    if (jobs.length === 0) {
      console.log('⚠️  No jobs found in database');
      return;
    }
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    let estimateStructures = {};
    let pricingAnalysis = {
      has_estimated_cost: 0,
      has_final_cost: 0,
      has_estimate_json: 0,
      missing_all_pricing: 0,
      estimate_json_structures: []
    };
    
    // 2. Analyze each job
    for (const job of jobs) {
      console.log(`\n🔧 Analyzing Job ${job.jobNo || job.id}...`);
      console.log(`  estimated_cost: ${job.estimated_cost}`);
      console.log(`  final_cost: ${job.final_cost}`);
      console.log(`  estimate: ${job.estimate ? 'has JSON data' : 'null'}`);
      
      // Count pricing fields
      if (job.estimated_cost && job.estimated_cost > 0) {
        pricingAnalysis.has_estimated_cost++;
      }
      if (job.final_cost && job.final_cost > 0) {
        pricingAnalysis.has_final_cost++;
      }
      if (job.estimate && typeof job.estimate === 'object') {
        pricingAnalysis.has_estimate_json++;
        
        // Analyze JSON structure
        const keys = Object.keys(job.estimate);
        const structureKey = keys.sort().join(',');
        if (!estimateStructures[structureKey]) {
          estimateStructures[structureKey] = {
            count: 0,
            example: job.estimate,
            jobs: []
          };
        }
        estimateStructures[structureKey].count++;
        estimateStructures[structureKey].jobs.push(job.jobNo || job.id);
        
        console.log(`  estimate JSON keys: ${keys.join(', ')}`);
        
        // Extract pricing from estimate JSON if available
        let estimateFromJSON = null;
        if (job.estimate.total_price) {
          estimateFromJSON = parseFloat(job.estimate.total_price);
        } else if (job.estimate.totalPrice) {
          estimateFromJSON = parseFloat(job.estimate.totalPrice);
        } else if (job.estimate.price) {
          estimateFromJSON = parseFloat(job.estimate.price);
        } else if (job.estimate.cost) {
          estimateFromJSON = parseFloat(job.estimate.cost);
        } else if (job.estimate.amount) {
          estimateFromJSON = parseFloat(job.estimate.amount);
        }
        
        if (estimateFromJSON && estimateFromJSON > 0) {
          console.log(`  💰 Found price in JSON: $${estimateFromJSON}`);
        }
      }
      
      // Check if job has no pricing info at all
      if ((!job.estimated_cost || job.estimated_cost <= 0) && 
          (!job.final_cost || job.final_cost <= 0) && 
          !job.estimate) {
        pricingAnalysis.missing_all_pricing++;
        console.log(`  ⚠️  Missing all pricing information`);
      }
    }
    
    // 3. Analysis Summary
    console.log('\n📊 Analysis Summary:');
    console.log(`  Jobs with estimated_cost: ${pricingAnalysis.has_estimated_cost}/${jobs.length}`);
    console.log(`  Jobs with final_cost: ${pricingAnalysis.has_final_cost}/${jobs.length}`);
    console.log(`  Jobs with estimate JSON: ${pricingAnalysis.has_estimate_json}/${jobs.length}`);
    console.log(`  Jobs missing all pricing: ${pricingAnalysis.missing_all_pricing}/${jobs.length}`);
    
    console.log('\n🏗️  Estimate JSON Structures Found:');
    Object.entries(estimateStructures).forEach(([structure, data]) => {
      console.log(`  Structure "${structure}": ${data.count} jobs`);
      console.log(`    Example:`, JSON.stringify(data.example, null, 2));
      console.log(`    Jobs: ${data.jobs.slice(0, 3).join(', ')}${data.jobs.length > 3 ? '...' : ''}`);
    });
    
    // 4. Generate improved statistics logic
    await generateImprovedStatsLogic(jobs, pricingAnalysis, estimateStructures);
    
    
    // 6. Summary
    console.log('\n📊 Analysis Summary:');
    console.log(`  ✅ Jobs analyzed: ${jobs.length}`);
    console.log(`  💰 Pricing data coverage: ${((jobs.length - pricingAnalysis.missing_all_pricing) / jobs.length * 100).toFixed(1)}%`);
    
    // 7. Create improved useJobs hook
    console.log('\n� Creating improved statistics calculation...');
    await createImprovedJobStatsHook(jobs, pricingAnalysis, estimateStructures);
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

async function generateImprovedStatsLogic(jobs, analysis, structures) {
  console.log('\n🧮 Generating improved statistics logic...');
  
  // Calculate current statistics with improved logic
  let totalEstimatedValue = 0;
  let totalFinalValue = 0;
  let jobsWithPricing = 0;
  
  for (const job of jobs) {
    let jobValue = 0;
    
    // Improved pricing extraction logic
    if (job.final_cost && parseFloat(job.final_cost) > 0) {
      jobValue = parseFloat(job.final_cost);
    } else if (job.estimated_cost && parseFloat(job.estimated_cost) > 0) {
      jobValue = parseFloat(job.estimated_cost);
    } else if (job.estimate && typeof job.estimate === 'object') {
      // Extract from JSON - the data shows all jobs have estimate.total
      if (job.estimate.total && parseFloat(job.estimate.total) > 0) {
        jobValue = parseFloat(job.estimate.total);
      } else if (job.estimate.total_price && parseFloat(job.estimate.total_price) > 0) {
        jobValue = parseFloat(job.estimate.total_price);
      } else if (job.estimate.totalPrice && parseFloat(job.estimate.totalPrice) > 0) {
        jobValue = parseFloat(job.estimate.totalPrice);
      } else if (job.estimate.price && parseFloat(job.estimate.price) > 0) {
        jobValue = parseFloat(job.estimate.price);
      } else if (job.estimate.cost && parseFloat(job.estimate.cost) > 0) {
        jobValue = parseFloat(job.estimate.cost);
      } else if (job.estimate.amount && parseFloat(job.estimate.amount) > 0) {
        jobValue = parseFloat(job.estimate.amount);
      }
    }
    
    if (jobValue > 0) {
      totalFinalValue += jobValue;
      jobsWithPricing++;
      
      // Also add to estimated if we used estimate field
      if (!job.final_cost && !job.estimated_cost) {
        totalEstimatedValue += jobValue;
      } else {
        // Ensure we're adding numbers, not concatenating strings
        totalEstimatedValue += parseFloat(job.estimated_cost) || jobValue;
      }
      
      // Debug: Check if we're getting invalid values
      if (!Number.isFinite(totalEstimatedValue) || !Number.isFinite(totalFinalValue)) {
        console.log(`❌ Invalid value detected for job ${job.jobNo}: jobValue=${jobValue}, estimated=${job.estimated_cost}, totalEst=${totalEstimatedValue}, totalFinal=${totalFinalValue}`);
      }
    }
  }
  
  console.log(`  📊 Improved calculations:`);
  console.log(`    Jobs with pricing: ${jobsWithPricing}/${jobs.length}`);
  console.log(`    Total estimated value: $${(Number.isFinite(totalEstimatedValue) ? totalEstimatedValue : 0).toFixed(2)}`);
  console.log(`    Total final value: $${(Number.isFinite(totalFinalValue) ? totalFinalValue : 0).toFixed(2)}`);
  console.log(`    Average job value: $${jobsWithPricing > 0 ? (totalFinalValue / jobsWithPricing).toFixed(2) : '0.00'}`);
}

async function createImprovedJobStatsHook(jobs, analysis, structures) {
  console.log('🔧 Creating improved useJobs hook with better statistics...');
  
  // Create improved statistics calculation function
  const improvedStatsCode = `
// Improved statistics calculation for job estimates
export const useJobStatsImproved = () => {
  const { user, session } = useAuth();
  
  const swrResult = useSWR(
    user && session ? 'job-stats-improved' : null, 
    async () => {
      const jobs = await fetchJobs();
      
      const totalJobs = jobs.length;
      const inProgress = jobs.filter(job => job.status === 'in_progress').length;
      const completed = jobs.filter(job => job.status === 'completed').length;
      const pending = jobs.filter(job => job.status === 'pending').length;
      
      // Improved value calculation
      let totalValue = 0;
      let jobsWithPricing = 0;
      
      jobs.forEach(job => {
        let jobValue = 0;
        
        // Priority order: final_cost -> estimated_cost -> estimate JSON
        if (job.final_cost && job.final_cost > 0) {
          jobValue = job.final_cost;
        } else if (job.estimated_cost && job.estimated_cost > 0) {
          jobValue = job.estimated_cost;
        } else if (job.estimate && typeof job.estimate === 'object') {
          // Extract from JSON estimate field
          if (job.estimate.total_price && job.estimate.total_price > 0) {
            jobValue = parseFloat(job.estimate.total_price);
          } else if (job.estimate.totalPrice && job.estimate.totalPrice > 0) {
            jobValue = parseFloat(job.estimate.totalPrice);
          } else if (job.estimate.price && job.estimate.price > 0) {
            jobValue = parseFloat(job.estimate.price);
          } else if (job.estimate.cost && job.estimate.cost > 0) {
            jobValue = parseFloat(job.estimate.cost);
          } else if (job.estimate.amount && job.estimate.amount > 0) {
            jobValue = parseFloat(job.estimate.amount);
          }
        }
        
        if (jobValue > 0) {
          totalValue += jobValue;
          jobsWithPricing++;
        }
      });
      
      const avgJobValue = jobsWithPricing > 0 ? totalValue / jobsWithPricing : 0;

      return {
        total_jobs: totalJobs,
        in_progress: inProgress,
        completed: completed,
        pending: pending,
        total_value: totalValue,
        avg_job_value: avgJobValue,
        jobs_with_pricing: jobsWithPricing,
        pricing_coverage: jobsWithPricing / totalJobs * 100
      };
    }, 
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
      errorRetryCount: 2
    }
  );

  // Set up real-time subscription for job statistics
  useEffect(() => {
    if (!user || !session) return;

    const subscription = supabase
      .channel('job-stats-improved-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'jobs' },
        (payload) => {
          console.log('Real-time job update for improved job-stats:', payload);
          mutate('job-stats-improved');
          mutate('jobs');
          mutate('jobs-with-customers');
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, session]);

  return swrResult;
};
  `;
  
  console.log('✅ Improved statistics calculation logic created');
  console.log('📝 You should update src/lib/hooks/useJobs.ts with the improved logic');
  
  return improvedStatsCode;
}

async function verifyConsolidation() {
  console.log('🔍 Final analysis verification...');
  
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, jobNo, estimated_cost, final_cost, estimate')
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('❌ Error verifying results:', error);
    return;
  }
  
  let jobsWithAnyPricing = 0;
  let totalValueFromAllSources = 0;
  
  jobs.forEach(job => {
    let hasAnyPricing = false;
    let jobValue = 0;
    
    if (job.estimated_cost && job.estimated_cost > 0) {
      hasAnyPricing = true;
      jobValue = Math.max(jobValue, job.estimated_cost);
    }
    if (job.final_cost && job.final_cost > 0) {
      hasAnyPricing = true;
      jobValue = job.final_cost; // final_cost takes priority
    }
    if (job.estimate && typeof job.estimate === 'object') {
      // Check for pricing in JSON
      const jsonPrice = job.estimate.total_price || job.estimate.totalPrice || 
                       job.estimate.price || job.estimate.cost || job.estimate.amount;
      if (jsonPrice && jsonPrice > 0) {
        hasAnyPricing = true;
        if (jobValue === 0) jobValue = parseFloat(jsonPrice);
      }
    }
    
    if (hasAnyPricing) {
      jobsWithAnyPricing++;
      totalValueFromAllSources += jobValue;
    }
  });
  
  console.log(`📊 Final Verification:`);
  console.log(`  Jobs with any pricing data: ${jobsWithAnyPricing}/${jobs.length} (${(jobsWithAnyPricing/jobs.length*100).toFixed(1)}%)`);
  console.log(`  Total business value: $${totalValueFromAllSources.toFixed(2)}`);
  console.log(`  Average job value: $${(totalValueFromAllSources/jobsWithAnyPricing).toFixed(2)}`);
  
  if (jobsWithAnyPricing >= jobs.length * 0.8) {
    console.log('✅ Good pricing data coverage - statistics will be accurate!');
  } else {
    console.log('⚠️  Some jobs missing pricing data - consider data entry improvements');
  }
}

// Run the migration
if (require.main === module) {
  consolidateJobEstimates()
    .then(() => {
      console.log('\n🎉 Job estimates consolidation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { consolidateJobEstimates };