const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Checking environment variables...');
console.log('Supabase URL:', supabaseUrl ? 'Found' : 'Missing');
console.log('Anon Key:', supabaseAnonKey ? 'Found' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create Supabase client with anon key for testing
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAndFixPaperSpecifications() {
  try {
    console.log('🚀 Starting paper specifications check...');
    
    // Test the connection first with a simple query
    console.log('🔍 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('customers')
      .select('id')
      .limit(1);
    
    if (testError && testError.code !== '42501') {
      console.error('❌ Connection test failed:', testError.message);
      throw testError;
    } else if (testError && testError.code === '42501') {
      console.log('⚠️  Permission denied - this is expected if RLS is enabled');
    } else {
      console.log('✅ Connection successful');
    }
    
    // Check if paper specifications tables exist
    console.log('\n🔍 Checking if paper specifications tables exist...');
    
    const tablesToCheck = ['paper_sizes', 'paper_weights', 'paper_types'];
    const missingTables = [];
    
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        
        if (error && error.code === '42P01') {
          // Table doesn't exist
          console.log(`❌ Table ${table} does not exist`);
          missingTables.push(table);
        } else if (error) {
          // Other error (like permission denied)
          console.log(`⚠️  Cannot access ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table} exists`);
        }
      } catch (err) {
        console.log(`⚠️  Error checking ${table}: ${err.message}`);
      }
    }
    
    if (missingTables.length > 0) {
      console.log('\n📋 Missing tables detected. Please run the SQL migration manually:');
      console.log('\n1. Go to your Supabase dashboard: https://supabase.com/dashboard');
      console.log('2. Select your project');
      console.log('3. Navigate to SQL Editor');
      console.log('4. Copy and paste the contents of: migrations/create_paper_specifications.sql');
      console.log('5. Click "Run" to execute the migration');
    } else {
      console.log('\n✅ All paper specifications tables are present');
    }
    
    // Check if finish_options table exists (needed for job submission)
    console.log('\n🔍 Checking if finish_options table exists...');
    try {
      const { data, error } = await supabase
        .from('finish_options')
        .select('id')
        .limit(1);
      
      if (error && error.code === '42P01') {
        console.log('❌ Table finish_options does not exist');
        console.log('\n📋 Please also create the finish_options table with appropriate data');
      } else if (error) {
        console.log(`⚠️  Cannot access finish_options: ${error.message}`);
      } else {
        console.log('✅ Table finish_options exists');
      }
    } catch (err) {
      console.log(`⚠️  Error checking finish_options: ${err.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the check
checkAndFixPaperSpecifications();