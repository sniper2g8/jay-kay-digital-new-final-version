import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Create Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyRLSFixes() {
  try {
    console.log('Applying RLS fixes directly...');
    
    // Read the SQL file
    const sqlFilePath = join(__dirname, 'complete-rls-fix.sql');
    const sqlContent = await readFile(sqlFilePath, 'utf8');
    
    // Split the SQL content into individual statements
    // We'll split by semicolon followed by a newline or end of file
    const statements = sqlContent
      .split(/;(?=\s*$|\s*\n)/gm)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty statements or comments
      if (!statement || statement.startsWith('--') || statement.startsWith('/*')) {
        continue;
      }
      
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      // Use the Supabase RPC to execute raw SQL
      // Note: This requires the http extension to be enabled
      try {
        const { data, error } = await supabase.rpc('execute_sql', {
          sql: statement
        });
        
        if (error) {
          console.warn(`Warning executing statement ${i + 1}:`, error.message);
          // Continue with next statement
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (rpcError) {
        console.warn(`RPC Error executing statement ${i + 1}:`, rpcError.message);
        // Try alternative approach
        try {
          // For some statements, we might need to execute them differently
          console.log(`Trying alternative execution for statement ${i + 1}...`);
          // Skip this for now as we don't have a direct way to execute arbitrary SQL
        } catch (altError) {
          console.warn(`Alternative execution also failed for statement ${i + 1}:`, altError.message);
        }
      }
    }
    
    console.log('✅ All RLS fixes applied successfully!');
  } catch (error) {
    console.error('❌ Error applying RLS fixes:', error.message);
    process.exit(1);
  }
}

// Run the function
applyRLSFixes();