const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Checking environment variables...');
console.log('Supabase URL:', supabaseUrl ? 'Found' : 'Missing');
console.log('Service Key:', supabaseServiceKey ? 'Found' : 'Missing');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runPaperSpecificationsMigration() {
  try {
    console.log('🚀 Starting paper specifications migration...');
    
    // Test the connection first
    console.log('🔍 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('customers')
      .select('count(*)')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection test failed:', testError.message);
      throw testError;
    }
    
    console.log('✅ Connection successful');
    
    // Read the SQL migration file
    const migrationPath = path.join(__dirname, 'create_paper_specifications.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📖 Read migration file successfully');
    console.log('📄 Migration file size:', migrationSQL.length, 'characters');
    
    // For now, we'll provide instructions to run manually
    console.log('\n📋 MANUAL MIGRATION REQUIRED:');
    console.log('Due to RPC limitations, please run this migration manually:');
    console.log('\n1. Go to your Supabase dashboard: https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Navigate to SQL Editor');
    console.log('4. Copy and paste the contents of: migrations/create_paper_specifications.sql');
    console.log('5. Click "Run" to execute the migration');
    
    console.log('\n✨ After running the migration, the following tables will be created:');
    console.log('- paper_sizes (A0-A6, Letter, Legal, etc.)');
    console.log('- paper_weights (60-350 GSM)');
    console.log('- paper_types (Copy, Glossy, Matte, etc.)');
    
    // Try to check if tables already exist
    console.log('\n🔍 Checking if tables already exist...');
    
    try {
      const { data: paperSizes } = await supabase
        .from('paper_sizes')
        .select('count(*)')
        .limit(1);
      
      if (paperSizes) {
        console.log('✅ Migration appears to be already completed!');
        console.log('📊 Paper specifications tables are available');
        return;
      }
    } catch (checkError) {
      console.log('⚠️  Tables not found - migration needed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 Please run the migration manually in Supabase dashboard');
  }
}

// Run the migration
runPaperSpecificationsMigration();