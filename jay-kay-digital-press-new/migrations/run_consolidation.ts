import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Starting customer consolidation migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), 'migrations', 'final_customer_consolidation.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Remove comments and split into individual statements
    const statements = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim())
      .join('\n')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && stmt !== 'BEGIN' && stmt !== 'COMMIT');
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement using direct SQL execution
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;
      
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      console.log(`   ${statement.substring(0, 60)}...`);
      
      // Try direct SQL execution
      const { error } = await supabase
        .from('_temp') // This will fail but we'll catch and try RPC
        .select('1')
        .limit(0);
      
      // Use a more direct approach
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ sql: statement })
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Error executing statement ${i + 1}:`, error);
        throw new Error(error);
      }
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('🔄 Remember to regenerate TypeScript types');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('💡 Trying alternative approach...');
    
    // Alternative: Execute the entire SQL file as one block
    try {
      const migrationPath = path.join(process.cwd(), 'migrations', 'final_customer_consolidation.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // Remove only comment lines, keep the structure
      const cleanSQL = migrationSQL
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n');
      
      console.log('📄 Executing entire migration as single block...');
      
      // This approach may work better with Supabase
      const { error } = await supabase.rpc('exec_sql', { sql_query: cleanSQL });
      
      if (error) {
        throw error;
      }
      
      console.log('✅ Alternative approach succeeded!');
      
    } catch (altError) {
      console.error('❌ Alternative approach also failed:', altError);
      console.log('📝 Please run the SQL manually in Supabase dashboard');
      process.exit(1);
    }
  }
}

runMigration();
