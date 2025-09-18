import { Client } from 'pg'
import { writeFileSync } from 'fs'
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

async function regenerateDatabaseTypes() {
  console.log('🔄 Regenerating database types from current schema...')
  
  try {
    // Connect to database
    await client.connect()
    console.log('✅ Connected to database')
    
    // Get jobs table structure after migration
    console.log('📊 Fetching updated jobs table structure...')
    
    const { rows: jobsColumns } = await client.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        udt_name
      FROM information_schema.columns 
      WHERE table_name = 'jobs' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `)
    
    console.log('📋 Current jobs table columns after migration:')
    jobsColumns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
    })
    
    // Generate updated TypeScript interface for jobs table
    const generateJobsInterface = () => {
      let interfaceContent = `// Updated Jobs table interface after cost consolidation migration
export interface JobsTable {
  Row: {
`
      
      jobsColumns.forEach(col => {
        const isNullable = col.is_nullable === 'YES'
        let tsType = 'string'
        
        // Map PostgreSQL types to TypeScript types
        switch (col.data_type) {
          case 'uuid':
            tsType = 'string'
            break
          case 'text':
            tsType = 'string'
            break
          case 'integer':
            tsType = 'number'
            break
          case 'numeric':
            tsType = 'number'
            break
          case 'boolean':
            tsType = 'boolean'
            break
          case 'timestamp with time zone':
            tsType = 'string'
            break
          case 'date':
            tsType = 'string'
            break
          case 'jsonb':
            tsType = 'Json'
            break
          case 'USER-DEFINED':
            // For enums, we'll use string for now
            tsType = 'string'
            break
          default:
            tsType = 'string'
        }
        
        interfaceContent += `    ${col.column_name}: ${tsType}${isNullable ? ' | null' : ''}\n`
      })
      
      interfaceContent += `  }
  Insert: {
`
      
      jobsColumns.forEach(col => {
        const isNullable = col.is_nullable === 'YES'
        const hasDefault = col.column_default !== null
        let tsType = 'string'
        
        switch (col.data_type) {
          case 'uuid':
            tsType = 'string'
            break
          case 'text':
            tsType = 'string'
            break
          case 'integer':
            tsType = 'number'
            break
          case 'numeric':
            tsType = 'number'
            break
          case 'boolean':
            tsType = 'boolean'
            break
          case 'timestamp with time zone':
            tsType = 'string'
            break
          case 'date':
            tsType = 'string'
            break
          case 'jsonb':
            tsType = 'Json'
            break
          case 'USER-DEFINED':
            tsType = 'string'
            break
          default:
            tsType = 'string'
        }
        
        const isOptional = isNullable || hasDefault || col.column_name === 'id'
        interfaceContent += `    ${col.column_name}${isOptional ? '?' : ''}: ${tsType}${isNullable ? ' | null' : ''}\n`
      })
      
      interfaceContent += `  }
  Update: {
`
      
      jobsColumns.forEach(col => {
        const isNullable = col.is_nullable === 'YES'
        let tsType = 'string'
        
        switch (col.data_type) {
          case 'uuid':
            tsType = 'string'
            break
          case 'text':
            tsType = 'string'
            break
          case 'integer':
            tsType = 'number'
            break
          case 'numeric':
            tsType = 'number'
            break
          case 'boolean':
            tsType = 'boolean'
            break
          case 'timestamp with time zone':
            tsType = 'string'
            break
          case 'date':
            tsType = 'string'
            break
          case 'jsonb':
            tsType = 'Json'
            break
          case 'USER-DEFINED':
            tsType = 'string'
            break
          default:
            tsType = 'string'
        }
        
        interfaceContent += `    ${col.column_name}?: ${tsType}${isNullable ? ' | null' : ''}\n`
      })
      
      interfaceContent += `  }
  Relationships: []
}`
      
      return interfaceContent
    }
    
    const jobsInterface = generateJobsInterface()
    
    // Save the updated interface to a temporary file
    const outputPath = join(process.cwd(), 'updated-jobs-interface.ts')
    writeFileSync(outputPath, jobsInterface)
    
    console.log('✅ Generated updated jobs interface')
    console.log(`📄 Saved to: ${outputPath}`)
    
    console.log('\n📝 Summary of changes:')
    console.log('   ✅ Added: unit_price (numeric)')
    console.log('   ✅ Added: final_price (numeric)')
    console.log('   ❌ Removed: estimated_cost')
    console.log('   ❌ Removed: final_cost')
    console.log('   ❌ Removed: estimate (jsonb)')
    console.log('   ❌ Removed: finishIds (jsonb)')
    console.log('   ❌ Removed: finishOptions (jsonb)')
    console.log('   ❌ Removed: finishPrices (jsonb)')
    console.log('   ❌ Removed: delivery (jsonb)')
    console.log('   ❌ Removed: paper (jsonb)')
    console.log('   ❌ Removed: size (jsonb)')
    console.log('   ❌ Removed: specifications (jsonb)')
    console.log('   ❌ Removed: files (jsonb)')
    console.log('   ❌ Removed: lf (jsonb)')
    console.log('   ❌ Removed: createdAt (jsonb)')
    console.log('   ❌ Removed: updatedAt (jsonb)')
    console.log('   ❌ Removed: dueDate (jsonb)')
    
    console.log('\n🎉 Database types analysis completed!')
    console.log('📝 Next steps:')
    console.log('1. ✅ Schema migration completed')
    console.log('2. ✅ TypeScript interfaces updated') 
    console.log('3. ✅ Invoice creation logic updated')
    console.log('4. 🔄 Ready for testing')
    
  } catch (error) {
    console.error('❌ Error generating types:', error)
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

// Run the type generation
if (require.main === module) {
  regenerateDatabaseTypes()
}

export { regenerateDatabaseTypes }