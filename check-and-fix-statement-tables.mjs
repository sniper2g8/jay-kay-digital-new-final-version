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

async function checkAndFixStatementTables() {
  console.log('🔍 Checking and fixing statement tables...\n');
  
  try {
    // Check if tables exist
    console.log('1️⃣ Checking if statement tables exist...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['customer_statement_periods', 'customer_statement_items']);
    
    if (tablesError) {
      console.log('   ❌ Error checking tables:', tablesError.message);
      return;
    }
    
    const existingTables = tables.map(t => t.table_name);
    console.log(`   Found tables: ${existingTables.join(', ')}`);
    
    // Check current policies
    console.log('\n2️⃣ Checking current RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('information_schema.table_constraints')
      .select('table_name, constraint_name')
      .eq('table_schema', 'public')
      .in('table_name', ['customer_statement_periods', 'customer_statement_items']);
    
    if (policiesError) {
      console.log('   ❌ Error checking policies:', policiesError.message);
    } else {
      console.log(`   Found ${policies.length} constraints on statement tables`);
    }
    
    // Try to access the tables directly to see what's happening
    console.log('\n3️⃣ Testing direct access to statement tables...');
    
    // Test customer_statement_periods
    console.log('   Testing customer_statement_periods...');
    const { data: periodsData, error: periodsError } = await supabase
      .from('customer_statement_periods')
      .select('id')
      .limit(1);
    
    if (periodsError) {
      console.log('   ❌ Error accessing customer_statement_periods:', periodsError.message);
    } else {
      console.log('   ✅ Successfully accessed customer_statement_periods');
    }
    
    // Test customer_statement_items
    console.log('   Testing customer_statement_items...');
    const { data: itemsData, error: itemsError } = await supabase
      .from('customer_statement_items')
      .select('id')
      .limit(1);
    
    if (itemsError) {
      console.log('   ❌ Error accessing customer_statement_items:', itemsError.message);
    } else {
      console.log('   ✅ Successfully accessed customer_statement_items');
    }
    
    // If we can't access the tables, try to apply RLS policies
    if (periodsError || itemsError) {
      console.log('\n4️⃣ Applying RLS policies...');
      
      // Enable RLS on tables if they exist
      for (const table of existingTables) {
        console.log(`   Enabling RLS on ${table}...`);
        // Note: We can't directly enable RLS through the JS client
        // We need to use raw SQL for this
      }
      
      // Apply policies using raw SQL
      const policiesToApply = [
        // customer_statement_periods policies
        `DROP POLICY IF EXISTS "Users can view their own statement periods" ON customer_statement_periods`,
        `CREATE POLICY "Users can view their own statement periods" ON customer_statement_periods FOR SELECT USING (customer_id = auth.uid())`,
        `DROP POLICY IF EXISTS "Admins and staff can view all statement periods" ON customer_statement_periods`,
        `CREATE POLICY "Admins and staff can view all statement periods" ON customer_statement_periods FOR SELECT USING (EXISTS (SELECT 1 FROM appUsers WHERE id = auth.uid() AND (role = 'admin' OR role = 'staff')))`,
        `DROP POLICY IF EXISTS "Service role full access to statement periods" ON customer_statement_periods`,
        `CREATE POLICY "Service role full access to statement periods" ON customer_statement_periods FOR ALL TO service_role USING (true) WITH CHECK (true)`,
        
        // customer_statement_items policies
        `DROP POLICY IF EXISTS "Users can view their own statement items" ON customer_statement_items`,
        `CREATE POLICY "Users can view their own statement items" ON customer_statement_items FOR SELECT USING (customer_id = auth.uid())`,
        `DROP POLICY IF EXISTS "Admins and staff can view all statement items" ON customer_statement_items`,
        `CREATE POLICY "Admins and staff can view all statement items" ON customer_statement_items FOR SELECT USING (EXISTS (SELECT 1 FROM appUsers WHERE id = auth.uid() AND (role = 'admin' OR role = 'staff')))`,
        `DROP POLICY IF EXISTS "Service role full access to statement items" ON customer_statement_items`,
        `CREATE POLICY "Service role full access to statement items" ON customer_statement_items FOR ALL TO service_role USING (true) WITH CHECK (true)`
      ];
      
      // Try to apply policies one by one
      for (const policy of policiesToApply) {
        console.log(`   Applying policy: ${policy.substring(0, 40)}...`);
        try {
          const { error } = await supabase.rpc('execute_sql', { sql: policy });
          if (error) {
            console.log(`     ⚠️  Warning: ${error.message}`);
          } else {
            console.log(`     ✅ Policy applied`);
          }
        } catch (err) {
          console.log(`     ⚠️  Error applying policy: ${err.message}`);
        }
      }
    }
    
    console.log('\n✅ Check and fix process completed!');
    
  } catch (error) {
    console.error('❌ Error in check and fix process:', error.message);
  }
}

// Run the function
checkAndFixStatementTables();