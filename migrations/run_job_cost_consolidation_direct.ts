import { Client } from 'pg'
import { readFileSync } from 'fs'
import { join } from 'path'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

// Use DATABASE_URL if available, otherwise construct from individual components
const connectionString = process.env.DATABASE_URL || 
  `postgresql://postgres.${process.env.SUPABASE_PROJECT_REF}:${process.env.SUPABASE_DB_PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
})

async function runJobCostConsolidation() {
  console.log('🔄 Starting job cost column consolidation...')
  
  try {
    // Connect to database
    await client.connect()
    console.log('✅ Connected to database')
    
    // First, let's check the current state of the jobs table
    console.log('📊 Checking current jobs table structure...')
    
    const tableStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'jobs' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `)
    
    console.log('📋 Current jobs table columns:')
    tableStructure.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
    })
    
    // Check for existing data
    const { rows: costData } = await client.query(`
      SELECT 
        COUNT(*) as total_jobs,
        COUNT(estimated_cost) as has_estimated_cost,
        COUNT(final_cost) as has_final_cost,
        COUNT(quantity) as has_quantity,
        AVG(estimated_cost) as avg_estimated_cost,
        AVG(final_cost) as avg_final_cost
      FROM jobs
    `)
    
    console.log('📊 Current cost data distribution:')
    console.log(`   - Total jobs: ${costData[0].total_jobs}`)
    console.log(`   - Jobs with estimated_cost: ${costData[0].has_estimated_cost}`)
    console.log(`   - Jobs with final_cost: ${costData[0].has_final_cost}`)
    console.log(`   - Jobs with quantity: ${costData[0].has_quantity}`)
    console.log(`   - Average estimated_cost: $${parseFloat(costData[0].avg_estimated_cost || 0).toFixed(2)}`)
    console.log(`   - Average final_cost: $${parseFloat(costData[0].avg_final_cost || 0).toFixed(2)}`)
    
    // Ask for confirmation before running
    console.log('\n⚠️  WARNING: This migration will:')
    console.log('1. Add unit_price and final_price columns to jobs table')
    console.log('2. Migrate data from estimated_cost and final_cost')
    console.log('3. Create a backup table with removed data')
    console.log('4. Drop several redundant JSON columns')
    console.log('5. Add constraints and indexes for performance')
    
    // For automation, we'll proceed (in production, you might want user confirmation)
    console.log('\n🚀 Proceeding with migration...')
    
    // Read the migration SQL file
    const migrationPath = join(process.cwd(), 'migrations', 'consolidate_job_cost_columns.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')
    
    console.log('📖 Read migration file successfully')
    
    // Execute the migration as a single transaction
    console.log('🔄 Executing migration...')
    await client.query(migrationSQL)
    
    console.log('✅ Migration completed successfully!')
    
    // Verify the migration results
    console.log('🔍 Verifying migration results...')
    
    const { rows: newStructure } = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'jobs' AND table_schema = 'public'
      AND column_name IN ('unit_price', 'final_price', 'quantity')
      ORDER BY ordinal_position;
    `)
    
    console.log('✅ New cost columns:')
    newStructure.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
    })
    
    const { rows: verificationData } = await client.query(`
      SELECT 
        COUNT(*) as total_jobs,
        COUNT(CASE WHEN unit_price > 0 THEN 1 END) as jobs_with_unit_price,
        COUNT(CASE WHEN final_price > 0 THEN 1 END) as jobs_with_final_price,
        AVG(unit_price) as avg_unit_price,
        AVG(final_price) as avg_final_price
      FROM jobs
    `)
    
    console.log('✅ Migration verification:')
    console.log(`   - Total jobs: ${verificationData[0].total_jobs}`)
    console.log(`   - Jobs with unit_price: ${verificationData[0].jobs_with_unit_price}`)
    console.log(`   - Jobs with final_price: ${verificationData[0].jobs_with_final_price}`)
    console.log(`   - Average unit_price: $${parseFloat(verificationData[0].avg_unit_price || 0).toFixed(2)}`)
    console.log(`   - Average final_price: $${parseFloat(verificationData[0].avg_final_price || 0).toFixed(2)}`)
    
    // Check sample updated jobs
    const { rows: sampleJobs } = await client.query(`
      SELECT id, title, quantity, unit_price, final_price 
      FROM jobs 
      WHERE unit_price > 0 OR final_price > 0 
      ORDER BY created_at DESC 
      LIMIT 5
    `)
    
    console.log('📋 Sample updated jobs:')
    sampleJobs.forEach(job => {
      console.log(`   - ${job.title || job.id}: Qty ${job.quantity}, Unit $${job.unit_price}, Final $${job.final_price}`)
    })
    
    // Check if backup table was created
    const { rows: backupCheck } = await client.query(`
      SELECT COUNT(*) as backup_count
      FROM jobs_backup_data
    `)
    
    if (backupCheck[0].backup_count > 0) {
      console.log(`✅ Backup table created with ${backupCheck[0].backup_count} records`)
    }
    
    console.log('\n🎉 Job cost consolidation completed successfully!')
    console.log('📝 Next steps:')
    console.log('1. ✅ Database migration completed')
    console.log('2. 🔄 Update TypeScript interfaces')
    console.log('3. 🔄 Update invoice creation logic')
    console.log('4. 🔄 Regenerate database types')
    console.log('5. 🔄 Test invoice creation flow')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    console.log('💡 Error details:')
    console.log('   - Check database connection')
    console.log('   - Verify PostgreSQL permissions')
    console.log('   - Review migration SQL syntax')
    throw error
  } finally {
    await client.end()
    console.log('🔌 Database connection closed')
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Run the migration
if (require.main === module) {
  runJobCostConsolidation()
}

export { runJobCostConsolidation }