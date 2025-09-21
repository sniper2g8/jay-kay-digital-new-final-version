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
const supabase = createClient(supabaseUrl, supabaseSecretKey);

// Function to apply RLS policies
async function applyRLSPolicies() {
  console.log('🔧 Applying RLS Policies...\n');
  
  try {
    // Enable RLS on all tables
    const tables = [
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
    
    for (const table of tables) {
      console.log(`Enabling RLS on ${table}...`);
      const { error } = await supabase.rpc('enable_rls', { table_name: table });
      if (error) {
        console.log(`  ⚠️  Warning: ${error.message}`);
      } else {
        console.log(`  ✅ RLS enabled on ${table}`);
      }
    }
    
    // Apply specific policies
    console.log('\nApplying specific policies...');
    
    // appUsers policies
    const appUsersPolicies = [
      `DROP POLICY IF EXISTS "Users can view their own profile" ON appUsers`,
      `CREATE POLICY "Users can view their own profile" ON appUsers FOR SELECT USING (id = auth.uid())`,
      `DROP POLICY IF EXISTS "Users can update their own profile" ON appUsers`,
      `CREATE POLICY "Users can update their own profile" ON appUsers FOR UPDATE USING (id = auth.uid())`,
      `DROP POLICY IF EXISTS "Service role can access all profiles" ON appUsers`,
      `CREATE POLICY "Service role can access all profiles" ON appUsers FOR ALL TO service_role USING (true) WITH CHECK (true)`
    ];
    
    // customers policies
    const customersPolicies = [
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
    ];
    
    // statement periods policies
    const statementPeriodsPolicies = [
      `DROP POLICY IF EXISTS "Users can view their own statement periods" ON customer_statement_periods`,
      `CREATE POLICY "Users can view their own statement periods" ON customer_statement_periods FOR SELECT USING (customer_id = auth.uid())`,
      `DROP POLICY IF EXISTS "Admins and staff can view all statement periods" ON customer_statement_periods`,
      `CREATE POLICY "Admins and staff can view all statement periods" ON customer_statement_periods FOR SELECT USING (EXISTS (SELECT 1 FROM appUsers WHERE id = auth.uid() AND (role = 'admin' OR role = 'staff')))`,
      `DROP POLICY IF EXISTS "Service role full access to statement periods" ON customer_statement_periods`,
      `CREATE POLICY "Service role full access to statement periods" ON customer_statement_periods FOR ALL TO service_role USING (true) WITH CHECK (true)`
    ];
    
    // statement items policies
    const statementItemsPolicies = [
      `DROP POLICY IF EXISTS "Users can view their own statement items" ON customer_statement_items`,
      `CREATE POLICY "Users can view their own statement items" ON customer_statement_items FOR SELECT USING (customer_id = auth.uid())`,
      `DROP POLICY IF EXISTS "Admins and staff can view all statement items" ON customer_statement_items`,
      `CREATE POLICY "Admins and staff can view all statement items" ON customer_statement_items FOR SELECT USING (EXISTS (SELECT 1 FROM appUsers WHERE id = auth.uid() AND (role = 'admin' OR role = 'staff')))`,
      `DROP POLICY IF EXISTS "Service role full access to statement items" ON customer_statement_items`,
      `CREATE POLICY "Service role full access to statement items" ON customer_statement_items FOR ALL TO service_role USING (true) WITH CHECK (true)`
    ];
    
    // Apply all policies
    const allPolicies = [
      ...appUsersPolicies,
      ...customersPolicies,
      ...statementPeriodsPolicies,
      ...statementItemsPolicies
    ];
    
    for (const policy of allPolicies) {
      console.log(`Executing: ${policy.substring(0, 50)}...`);
      const { error } = await supabase.rpc('execute_sql', { sql: policy });
      if (error) {
        console.log(`  ⚠️  Warning: ${error.message}`);
      } else {
        console.log(`  ✅ Policy applied`);
      }
    }
    
    console.log('\n✅ RLS policies applied successfully!');
    
  } catch (error) {
    console.error('❌ Error applying RLS policies:', error.message);
  }
}

// Run the function
applyRLSPolicies();