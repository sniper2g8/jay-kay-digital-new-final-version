/**
 * Script to diagnose specific issues with statement tables
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseStatementTables() {
  console.log('🔬 Diagnosing statement table issues...\\n');
  
  // Check if statement tables exist
  const statementTables = [
    'customer_statement_periods',
    'customer_statement_transactions',
    'customer_account_balances',
    'statement_settings'
  ];
  
  for (const table of statementTables) {
    console.log(`📋 Checking ${table}...`);
    
    try {
      // Check table structure
      const { data: structureData, error: structureError } = await supabase.rpc('execute_sql', {
        query: `
          SELECT 
            column_name,
            data_type,
            is_nullable
          FROM information_schema.columns 
          WHERE table_name = '${table}'
          ORDER BY ordinal_position
        `
      });
      
      if (structureError) {
        console.log(`  ❌ Could not retrieve table structure: ${structureError.message}`);
        continue;
      }
      
      console.log(`  🏗️  Table structure:`);
      structureData.forEach(column => {
        console.log(`    ${column.column_name} (${column.data_type}) ${column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
      
      // Check table constraints
      const { data: constraintData, error: constraintError } = await supabase.rpc('execute_sql', {
        query: `
          SELECT 
            constraint_name,
            constraint_type
          FROM information_schema.table_constraints 
          WHERE table_name = '${table}'
        `
      });
      
      if (constraintError) {
        console.log(`  ℹ️  Could not retrieve constraints: ${constraintError.message}`);
      } else if (constraintData && constraintData.length > 0) {
        console.log(`  🔗 Constraints:`);
        constraintData.forEach(constraint => {
          console.log(`    ${constraint.constraint_name} (${constraint.constraint_type})`);
        });
      }
      
      // Try to access table data
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.log(`  ❌ Data access error: ${countError.message}`);
        // Try with service role specifically
        console.log(`  🧪 Testing with service role access...`);
        try {
          const { count: serviceCount, error: serviceError } = await supabase
            .from(table)
            .select('count()', { count: 'exact', head: true });
          
          if (serviceError) {
            console.log(`    ❌ Service role access also failed: ${serviceError.message}`);
          } else {
            console.log(`    ✅ Service role access successful: ${serviceCount} rows`);
          }
        } catch (serviceRoleError) {
          console.log(`    ❌ Service role test failed: ${serviceRoleError.message}`);
        }
      } else {
        console.log(`  ✅ Data access successful: ${count} rows`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error checking ${table}: ${error.message}`);
    }
    
    console.log('');
  }
  
  // Check relationships between tables
  console.log('🔗 Checking table relationships...');
  
  try {
    // Check foreign key relationships for statement tables
    const { data: fkData, error: fkError } = await supabase.rpc('execute_sql', {
      query: `
        SELECT
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM
          information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND (
          tc.table_name IN ('customer_statement_periods', 'customer_statement_transactions', 'customer_account_balances')
          OR ccu.table_name IN ('customer_statement_periods', 'customer_statement_transactions', 'customer_account_balances')
        )
        ORDER BY tc.table_name
      `
    });
    
    if (fkError) {
      console.log(`❌ Error checking foreign keys: ${fkError.message}`);
    } else if (fkData && fkData.length > 0) {
      console.log('Foreign key relationships:');
      fkData.forEach(fk => {
        console.log(`  ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    } else {
      console.log('No foreign key relationships found for statement tables');
    }
  } catch (error) {
    console.log(`❌ Error checking relationships: ${error.message}`);
  }
  
  console.log('\\n✅ Statement table diagnosis completed');
}

diagnoseStatementTables();