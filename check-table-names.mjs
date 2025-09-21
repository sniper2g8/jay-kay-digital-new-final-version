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

async function checkTableNames() {
  console.log('🔍 Checking actual table names...\n');
  
  try {
    // Try to get table names from information_schema
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (error) {
      console.log('❌ Error checking table names:', error.message);
      
      // Try a different approach - check specific tables
      const tablesToCheck = [
        'appusers', 'appUsers', 'AppUsers',
        'customers', 'Customers',
        'jobs', 'Jobs',
        'payments', 'Payments',
        'invoices', 'Invoices',
        'notifications', 'Notifications',
        'customer_statement_periods', 'customerStatementPeriods'
      ];
      
      console.log('\nTrying to access specific tables...');
      for (const table of tablesToCheck) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('id')
            .limit(1);
          
          if (error) {
            console.log(`  ❌ ${table}: ${error.message}`);
          } else {
            console.log(`  ✅ ${table}: Access successful`);
          }
        } catch (err) {
          console.log(`  ❌ ${table}: ${err.message}`);
        }
      }
    } else {
      console.log('✅ Found tables:');
      data.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error in check table names:', error.message);
  }
}

// Run the function
checkTableNames();