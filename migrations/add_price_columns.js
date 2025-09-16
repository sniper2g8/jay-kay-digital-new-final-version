const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/**
 * Migration: Add unit_price and estimate_price columns to jobs table
 * 
 * This migration:
 * 1. Adds unit_price and estimate_price numeric columns
 * 2. Extracts data from existing estimate JSON field
 * 3. Updates job forms and views to use new columns
 */

async function addPriceColumns() {
  console.log('🚀 Starting price columns migration...');
  
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // 1. Add the new columns
    console.log('\n📋 Step 1: Adding new columns...');
    
    await client.query(`
      ALTER TABLE jobs 
      ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10,2),
      ADD COLUMN IF NOT EXISTS estimate_price NUMERIC(10,2)
    `);
    
    console.log('✅ Added unit_price and estimate_price columns');

    // 2. Extract data from existing estimate JSON
    console.log('\n📋 Step 2: Extracting data from estimate JSON...');
    
    const { rows: jobs } = await client.query(`
      SELECT id, "jobNo", estimate, estimated_cost, final_cost
      FROM jobs 
      WHERE estimate IS NOT NULL
      ORDER BY created_at ASC
    `);
    
    console.log(`📊 Found ${jobs.length} jobs with estimate data to migrate`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const job of jobs) {
      try {
        const estimate = job.estimate;
        
        // Extract unit price (prioritize unitPriceUsed, then unitPrice)
        let unitPrice = null;
        if (estimate.unitPriceUsed && estimate.unitPriceUsed > 0) {
          unitPrice = parseFloat(estimate.unitPriceUsed);
        } else if (estimate.unitPrice && estimate.unitPrice > 0) {
          unitPrice = parseFloat(estimate.unitPrice);
        }
        
        // Extract estimate price (prioritize total from JSON, then estimated_cost)
        let estimatePrice = null;
        if (estimate.total && estimate.total > 0) {
          estimatePrice = parseFloat(estimate.total);
        } else if (job.estimated_cost && job.estimated_cost > 0) {
          estimatePrice = parseFloat(job.estimated_cost);
        }
        
        if (unitPrice || estimatePrice) {
          await client.query(`
            UPDATE jobs 
            SET unit_price = $1, estimate_price = $2 
            WHERE id = $3
          `, [unitPrice, estimatePrice, job.id]);
          
          console.log(`✅ Updated ${job.jobNo}: unit_price=${unitPrice}, estimate_price=${estimatePrice}`);
          migratedCount++;
        } else {
          console.log(`⚠️  Skipped ${job.jobNo}: no pricing data found`);
          skippedCount++;
        }
        
      } catch (err) {
        console.error(`❌ Error processing job ${job.jobNo}:`, err.message);
        skippedCount++;
      }
    }
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`  ✅ Successfully migrated: ${migratedCount} jobs`);
    console.log(`  ⚠️  Skipped: ${skippedCount} jobs`);
    
    // 3. Verify the migration
    console.log('\n📋 Step 3: Verifying migration...');
    
    const { rows: verification } = await client.query(`
      SELECT 
        COUNT(*) as total_jobs,
        COUNT(unit_price) as jobs_with_unit_price,
        COUNT(estimate_price) as jobs_with_estimate_price,
        AVG(unit_price) as avg_unit_price,
        AVG(estimate_price) as avg_estimate_price
      FROM jobs
    `);
    
    const stats = verification[0];
    console.log(`📊 Migration verification:`);
    console.log(`  Total jobs: ${stats.total_jobs}`);
    console.log(`  Jobs with unit_price: ${stats.jobs_with_unit_price}`);
    console.log(`  Jobs with estimate_price: ${stats.jobs_with_estimate_price}`);
    console.log(`  Average unit price: SLL ${parseFloat(stats.avg_unit_price || 0).toFixed(2)}`);
    console.log(`  Average estimate price: SLL ${parseFloat(stats.avg_estimate_price || 0).toFixed(2)}`);
    
    // 4. Show sample data
    console.log('\n📋 Step 4: Sample migrated data...');
    
    const { rows: samples } = await client.query(`
      SELECT "jobNo", unit_price, estimate_price, quantity
      FROM jobs 
      WHERE unit_price IS NOT NULL OR estimate_price IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    samples.forEach(sample => {
      console.log(`  ${sample.jobNo}: unit=${sample.unit_price || 'null'}, estimate=${sample.estimate_price || 'null'}, qty=${sample.quantity || 'null'}`);
    });
    
    console.log('\n🎉 Price columns migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
if (require.main === module) {
  addPriceColumns()
    .then(() => {
      console.log('\n✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addPriceColumns };