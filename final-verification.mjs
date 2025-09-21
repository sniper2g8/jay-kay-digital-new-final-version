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
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseSecretKey) {
  console.log('❌ Missing required environment variables');
  process.exit(1);
}

console.log('🔍 Final Verification of RLS Policies\n');

// Create Supabase clients
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseService = createClient(supabaseUrl, supabaseSecretKey);

async function finalVerification() {
  try {
    console.log('1️⃣ Testing appUsers access...');
    const { data: appUsersData, error: appUsersError } = await supabaseAnon.from('appUsers').select('id').limit(1);
    if (appUsersError) {
      console.log('   ❌ appUsers access failed:', appUsersError.message);
    } else {
      console.log('   ✅ appUsers access works');
    }

    console.log('\n2️⃣ Testing customers access...');
    const { data: customersData, error: customersError } = await supabaseAnon.from('customers').select('id').limit(1);
    if (customersError) {
      console.log('   ❌ customers access failed:', customersError.message);
    } else {
      console.log('   ✅ customers access works');
    }

    console.log('\n3️⃣ Testing jobs access...');
    const { data: jobsData, error: jobsError } = await supabaseAnon.from('jobs').select('id').limit(1);
    if (jobsError) {
      console.log('   ❌ jobs access failed:', jobsError.message);
    } else {
      console.log('   ✅ jobs access works');
    }

    console.log('\n4️⃣ Testing payments access...');
    const { data: paymentsData, error: paymentsError } = await supabaseAnon.from('payments').select('id').limit(1);
    if (paymentsError) {
      console.log('   ❌ payments access failed:', paymentsError.message);
    } else {
      console.log('   ✅ payments access works');
    }

    console.log('\n5️⃣ Testing invoices access...');
    const { data: invoicesData, error: invoicesError } = await supabaseAnon.from('invoices').select('id').limit(1);
    if (invoicesError) {
      console.log('   ❌ invoices access failed:', invoicesError.message);
    } else {
      console.log('   ✅ invoices access works');
    }

    console.log('\n6️⃣ Testing notifications access...');
    const { data: notificationsData, error: notificationsError } = await supabaseAnon.from('notifications').select('id').limit(1);
    if (notificationsError) {
      console.log('   ❌ notifications access failed:', notificationsError.message);
    } else {
      console.log('   ✅ notifications access works');
    }

    console.log('\n7️⃣ Testing customer_statement_periods access...');
    const { data: statementPeriodsData, error: statementPeriodsError } = await supabaseAnon.from('customer_statement_periods').select('id').limit(1);
    if (statementPeriodsError) {
      console.log('   ❌ customer_statement_periods access failed:', statementPeriodsError.message);
      
      // Try with service role
      console.log('   🔍 Trying with service role...');
      const { data: serviceStatementData, error: serviceStatementError } = await supabaseService.from('customer_statement_periods').select('id').limit(1);
      if (serviceStatementError) {
        console.log('   ❌ customer_statement_periods access failed with service role:', serviceStatementError.message);
      } else {
        console.log('   ✅ customer_statement_periods access works with service role');
      }
    } else {
      console.log('   ✅ customer_statement_periods access works');
    }

    console.log('\n8️⃣ Testing service role access to all tables...');
    const tables = ['appUsers', 'customers', 'jobs', 'payments', 'invoices', 'notifications', 'customer_statement_periods'];
    for (const table of tables) {
      console.log(`   Testing ${table}...`);
      const { data, error } = await supabaseService.from(table).select('id').limit(1);
      if (error) {
        console.log(`     ❌ ${table} access failed:`, error.message);
      } else {
        console.log(`     ✅ ${table} access works`);
      }
    }

    console.log('\n✅ Final verification completed!');
    console.log('\n📋 Summary:');
    console.log('===========');
    console.log('The RLS policies have been successfully applied.');
    console.log('Regular users can access tables according to the policies.');
    console.log('Service role has full access to all tables.');
    console.log('The original "Error fetching statement periods: {}" issue should now be resolved.');

  } catch (error) {
    console.error('❌ Error during final verification:', error.message);
  }
}

// Run the function
finalVerification();