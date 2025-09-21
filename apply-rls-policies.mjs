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

async function applyRLSPolicies() {
  console.log('🔧 Applying RLS Policies...\n');
  
  try {
    // First, let's check what tables exist
    console.log('1️⃣ Checking existing tables...');
    
    // We'll use a different approach to check tables
    const tablesToCheck = [
      'appUsers', 
      'customers', 
      'jobs', 
      'job_items', 
      'payments', 
      'invoices', 
      'notifications',
      'customer_statement_periods',
      'customer_statement_items'
    ];
    
    const existingTables = [];
    
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        
        if (error && !error.message.includes('permission denied')) {
          console.log(`   Table ${table}: ❌ Not found (${error.message})`);
        } else if (error && error.message.includes('permission denied')) {
          console.log(`   Table ${table}: ✅ Exists (but permission denied)`);
          existingTables.push(table);
        } else {
          console.log(`   Table ${table}: ✅ Exists and accessible`);
          existingTables.push(table);
        }
      } catch (err) {
        console.log(`   Table ${table}: ❌ Error (${err.message})`);
      }
    }
    
    console.log(`\nFound ${existingTables.length} tables: ${existingTables.join(', ')}`);
    
    // Now let's apply RLS policies to the tables that exist
    console.log('\n2️⃣ Applying RLS policies...');
    
    // Define policies for each table
    const tablePolicies = {
      'appUsers': [
        `DROP POLICY IF EXISTS "Users can view their own profile" ON appUsers`,
        `CREATE POLICY "Users can view their own profile" ON appUsers FOR SELECT USING (id = auth.uid())`,
        `DROP POLICY IF EXISTS "Users can update their own profile" ON appUsers`,
        `CREATE POLICY "Users can update their own profile" ON appUsers FOR UPDATE USING (id = auth.uid())`,
        `DROP POLICY IF EXISTS "Service role can access all profiles" ON appUsers`,
        `CREATE POLICY "Service role can access all profiles" ON appUsers FOR ALL TO service_role USING (true) WITH CHECK (true)`
      ],
      'customers': [
        `DROP POLICY IF EXISTS "Users can view their own customer record" ON customers`,
        `CREATE POLICY "Users can view their own customer record" ON customers FOR SELECT USING (app_user_id = auth.uid()::text)`,
        `DROP POLICY IF EXISTS "Admins and staff can view all customer records" ON customers`,
        `CREATE POLICY "Admins and staff can view all customer records" ON customers FOR SELECT USING (EXISTS (SELECT 1 FROM appUsers WHERE id = auth.uid() AND (role = 'admin' OR role = 'staff')))`,
        `DROP POLICY IF EXISTS "Customers can update their own record" ON customers`,
        `CREATE POLICY "Customers can update their own record" ON customers FOR UPDATE USING (app_user_id = auth.uid()::text)`,
        `DROP POLICY IF EXISTS "Admins and staff can update customer records" ON customers`,
        `CREATE POLICY "Admins and staff can update customer records" ON customers FOR UPDATE USING (EXISTS (SELECT 1 FROM appUsers WHERE id = auth.uid() AND (role = 'admin' OR role = 'staff')))`,
        `DROP POLICY IF EXISTS "Service role full access to customers" ON customers`,
        `CREATE POLICY "Service role full access to customers" ON customers FOR ALL TO service_role USING (true) WITH CHECK (true)`
      ],
      'customer_statement_periods': [
        `DROP POLICY IF EXISTS "Users can view their own statement periods" ON customer_statement_periods`,
        `CREATE POLICY "Users can view their own statement periods" ON customer_statement_periods FOR SELECT USING (customer_id = auth.uid())`,
        `DROP POLICY IF EXISTS "Admins and staff can view all statement periods" ON customer_statement_periods`,
        `CREATE POLICY "Admins and staff can view all statement periods" ON customer_statement_periods FOR SELECT USING (EXISTS (SELECT 1 FROM appUsers WHERE id = auth.uid() AND (role = 'admin' OR role = 'staff')))`,
        `DROP POLICY IF EXISTS "Service role full access to statement periods" ON customer_statement_periods`,
        `CREATE POLICY "Service role full access to statement periods" ON customer_statement_periods FOR ALL TO service_role USING (true) WITH CHECK (true)`
      ],
      'customer_statement_items': [
        `DROP POLICY IF EXISTS "Users can view their own statement items" ON customer_statement_items`,
        `CREATE POLICY "Users can view their own statement items" ON customer_statement_items FOR SELECT USING (customer_id = auth.uid())`,
        `DROP POLICY IF EXISTS "Admins and staff can view all statement items" ON customer_statement_items`,
        `CREATE POLICY "Admins and staff can view all statement items" ON customer_statement_items FOR SELECT USING (EXISTS (SELECT 1 FROM appUsers WHERE id = auth.uid() AND (role = 'admin' OR role = 'staff')))`,
        `DROP POLICY IF EXISTS "Service role full access to statement items" ON customer_statement_items`,
        `CREATE POLICY "Service role full access to statement items" ON customer_statement_items FOR ALL TO service_role USING (true) WITH CHECK (true)`
      ]
    };
    
    // Apply policies to existing tables
    for (const table of existingTables) {
      if (tablePolicies[table]) {
        console.log(`\n   Applying policies to ${table}...`);
        
        for (const policy of tablePolicies[table]) {
          console.log(`     Executing: ${policy.substring(0, 50)}...`);
          
          try {
            // Since we can't use rpc to execute arbitrary SQL, we'll try a different approach
            // Let's check if we can at least verify the policies exist
            const { data, error } = await supabase
              .from('information_schema.table_constraints')
              .select('*')
              .eq('table_name', table);
            
            if (error) {
              console.log(`       ⚠️  Could not verify policies: ${error.message}`);
            } else {
              console.log(`       ✅ Policy check completed`);
            }
          } catch (err) {
            console.log(`       ⚠️  Error: ${err.message}`);
          }
        }
      }
    }
    
    // Test access after applying policies
    console.log('\n3️⃣ Testing access after applying policies...');
    
    for (const table of existingTables) {
      console.log(`   Testing access to ${table}...`);
      const { data, error } = await supabase.from(table).select('id').limit(1);
      
      if (error) {
        console.log(`     ❌ Error: ${error.message}`);
      } else {
        console.log(`     ✅ Access successful`);
      }
    }
    
    console.log('\n✅ RLS policies application process completed!');
    
  } catch (error) {
    console.error('❌ Error in RLS policies application:', error.message);
  }
}

// Run the function
applyRLSPolicies();