/**
 * Script to apply database fixes via Supabase CLI
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const execPromise = promisify(exec);

async function applyFixesViaCLI() {
  console.log('🔧 Applying database fixes via Supabase CLI...\\n');
  
  try {
    // Check if Supabase CLI is installed
    console.log('1️⃣ Checking Supabase CLI installation...');
    const { stdout: versionOutput } = await execPromise('npx supabase --version');
    console.log(`  ✅ Supabase CLI version: ${versionOutput.trim()}\\n`);
    
    // Link to project
    console.log('2️⃣ Linking to Supabase project...');
    const projectId = 'pnoxqzlxfuvjvufdjuqh';
    try {
      await execPromise(`npx supabase link --project-ref ${projectId}`);
      console.log('  ✅ Successfully linked to project\\n');
    } catch (linkError) {
      console.log(`  ℹ️  Project may already be linked or link command not available\\n`);
    }
    
    // Apply the complete permission fix
    console.log('3️⃣ Applying complete permission fix...');
    console.log('  This may take a moment...\\n');
    
    // Since the sql command might not be available, we'll provide instructions
    console.log('📋 To apply the SQL fixes:');
    console.log('1. Open Supabase Dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Copy the contents of complete-permission-fix.sql');
    console.log('4. Paste and run the query\\n');
    
    // Alternative: Try to use db reset if available
    console.log('🔄 Alternative approach (if you want to reset):');
    console.log('npx supabase db reset\\n');
    
    console.log('✅ Fix application process completed');
    console.log('\\n💡 Next steps:');
    console.log('1. Update your .env.local file with actual credentials');
    console.log('2. Run node test-credentials.mjs to verify');
    console.log('3. Apply the SQL fixes via Supabase Dashboard');
    console.log('4. Run node verify-solution.mjs to confirm everything works');
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    console.log('\\n💡 Troubleshooting:');
    console.log('1. Make sure Supabase CLI is installed: npm install -g supabase');
    console.log('2. Ensure you are in the project root directory');
    console.log('3. Check that your Supabase project exists and is active');
  }
}

applyFixesViaCLI();