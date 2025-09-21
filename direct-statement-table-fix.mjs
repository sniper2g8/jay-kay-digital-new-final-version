import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local specifically
const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
  console.log('✅ Loaded environment variables from .env.local');
} else {
  console.log('❌ .env.local file not found');
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  console.log('❌ Missing required environment variables');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    persistSession: false
  }
});

async function directStatementTableFix() {
  console.log('🔧 Direct statement table fix...\n');
  
  try {
    // Try to access the statement tables directly
    console.log('1️⃣ Testing access to customer_statement_periods...');
    const { data: periodsData, error: periodsError } = await supabase
      .from('customer_statement_periods')
      .select('id')
      .limit(1);
    
    if (periodsError) {
      console.log('   ❌ Error:', periodsError.message);
    } else {
      console.log('   ✅ Access successful');
    }
    
    console.log('\n2️⃣ Testing access to customer_statement_items...');
    const { data: itemsData, error: itemsError } = await supabase
      .from('customer_statement_items')
      .select('id')
      .limit(1);
    
    if (itemsError) {
      console.log('   ❌ Error:', itemsError.message);
    } else {
      console.log('   ✅ Access successful');
    }
    
    // Try to check if RLS is enabled on these tables
    console.log('\n3️⃣ Checking RLS status...');
    
    // We'll try to create a simple policy to see if we have the necessary permissions
    console.log('   Testing policy creation...');
    
    // Try to create a simple permissive policy
    const { error: policyError } = await supabase.rpc('execute_sql', { 
      sql: `CREATE POLICY "test_policy" ON customer_statement_periods FOR SELECT USING (true)` 
    });
    
    if (policyError) {
      console.log('   ❌ Policy creation failed:', policyError.message);
      // Try with a different approach
      console.log('   Trying alternative approach...');
      
      // Check what tables we can actually access
      console.log('\n4️⃣ Testing access to other tables...');
      const tablesToTest = ['appUsers', 'customers', 'jobs', 'payments', 'invoices'];
      
      for (const table of tablesToTest) {
        console.log(`   Testing ${table}...`);
        const { data, error } = await supabase.from(table).select('id').limit(1);
        if (error) {
          console.log(`     ❌ Error: ${error.message}`);
        } else {
          console.log(`     ✅ Access successful`);
        }
      }
    } else {
      console.log('   ✅ Policy creation successful');
      // Drop the test policy
      await supabase.rpc('execute_sql', { 
        sql: `DROP POLICY "test_policy" ON customer_statement_periods` 
      });
    }
    
    console.log('\n✅ Direct statement table fix process completed!');
    
  } catch (error) {
    console.error('❌ Error in direct statement table fix:', error.message);
  }
}

// Run the function
directStatementTableFix();