import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runJobCostConsolidation() {
  console.log('🔄 Starting job cost column consolidation...')
  
  try {
    // First, let's check the current state of the jobs table
    console.log('📊 Checking current jobs table structure...')
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, estimated_cost, final_cost, quantity')
      .limit(5)
    
    if (jobsError) {
      console.error('❌ Error checking jobs table:', jobsError)
      return
    }
    
    console.log(`✅ Found ${jobs?.length || 0} sample jobs in table`)
    console.log('Sample data:', jobs)
    
    // Read the migration SQL file
    const migrationPath = join(process.cwd(), 'migrations', 'consolidate_job_cost_columns.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')
    
    console.log('📖 Read migration file successfully')
    
    // Ask for confirmation before running
    console.log('\n⚠️  WARNING: This migration will:')
    console.log('1. Add unit_price and final_price columns')
    console.log('2. Migrate data from estimated_cost and final_cost')
    console.log('3. Drop several redundant JSON columns')
    console.log('4. Create a backup table with removed data')
    
    // For automation, we'll proceed (in production, you might want user confirmation)
    console.log('\n🚀 Proceeding with migration...')
    
    // Execute the migration
    const { error: migrationError } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    })
    
    if (migrationError) {
      console.error('❌ Migration failed:', migrationError)
      return
    }
    
    console.log('✅ Migration completed successfully!')
    
    // Verify the migration results
    console.log('🔍 Verifying migration results...')
    
    const { data: verificationData, error: verificationError } = await supabase
      .from('jobs')
      .select('id, quantity, unit_price, final_price')
      .limit(10)
    
    if (verificationError) {
      console.error('❌ Error verifying results:', verificationError)
      return
    }
    
    console.log('✅ Migration verification:')
    console.log(`   - Jobs with unit_price: ${verificationData?.filter(j => j.unit_price > 0).length}`)
    console.log(`   - Jobs with final_price: ${verificationData?.filter(j => j.final_price > 0).length}`)
    console.log('\nSample updated jobs:')
    console.table(verificationData)
    
    // Check if backup table was created
    const { data: backupData, error: backupError } = await supabase
      .from('jobs_backup_data')
      .select('id')
      .limit(1)
    
    if (!backupError && backupData) {
      console.log('✅ Backup table created successfully')
    }
    
    console.log('\n🎉 Job cost consolidation completed!')
    console.log('📝 Next steps:')
    console.log('1. Update invoice creation to use unit_price and quantity')
    console.log('2. Test invoice creation with consolidated job data')
    console.log('3. Update any UI components that reference old cost columns')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
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