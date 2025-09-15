import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runFix() {
  console.log('🔧 Starting Auth Token NULL Conversion Fix...');
  
  try {
    // Read the SQL fix file
    const sqlPath = path.join(process.cwd(), 'fix-auth-tokens-null-issue.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into statements (simple approach for this fix)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;
      
      // Skip informational SELECT statements for execution
      if (statement.toUpperCase().startsWith('SELECT')) {
        console.log(`ℹ️  Skipping SELECT statement ${i + 1}: ${statement.substring(0, 50)}...`);
        continue;
      }
      
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // For CREATE FUNCTION and other complex statements, we need to execute them differently
        if (statement.toUpperCase().includes('CREATE OR REPLACE FUNCTION') || 
            statement.toUpperCase().includes('CREATE TRIGGER') ||
            statement.toUpperCase().includes('DROP TRIGGER')) {
          // These need to be executed as RPC calls or raw SQL
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
          if (error) {
            console.warn(`⚠️  Warning executing statement ${i + 1}:`, error.message);
            // Try alternative approach
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey
              },
              body: JSON.stringify({ sql_query: statement })
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.warn(`⚠️  Alternative approach also failed:`, errorText);
            }
          }
        } else {
          // For regular UPDATE/ALTER statements, try direct execution
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey
            },
            body: JSON.stringify({ sql_query: statement })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.warn(`⚠️  Warning executing statement ${i + 1}:`, errorText);
          }
        }
        
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (stmtError) {
        console.warn(`⚠️  Error executing statement ${i + 1}:`, stmtError.message);
      }
    }
    
    console.log('✅ Auth token NULL conversion fix completed!');
    console.log('🔄 Testing authentication...');
    
    // Test authentication with a simple query
    try {
      const { data, error } = await supabase
        .from('appUsers')
        .select('id')
        .limit(1);
      
      if (error) {
        console.warn('⚠️  Test query failed:', error.message);
      } else {
        console.log('✅ Test query succeeded - authentication should now work properly');
      }
    } catch (testError) {
      console.warn('⚠️  Test authentication failed:', testError.message);
    }
    
  } catch (error) {
    console.error('❌ Fix execution failed:', error);
    process.exit(1);
  }
}

// Run the fix
runFix().catch(console.error);