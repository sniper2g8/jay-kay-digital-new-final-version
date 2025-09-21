import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Initialize environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL', supabaseUrl ? '✓' : '✗');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY', supabaseServiceKey ? '✓' : '✗');
  console.error('\nMake sure your .env.local file contains these variables.');
  process.exit(1);
}

console.log('✓ Environment variables loaded');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixStatementPeriodsPolicies() {
  console.log('🔄 Fixing Statement Periods RLS Policies...\n');

  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const sqlPath = join(__dirname, 'fix-statement-periods-rls.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Error applying RLS policies:', error.message);
      return;
    }

    // Verify the policies
    const { data: policies, error: policyError } = await supabase
      .from('policies')
      .select('*')
      .eq('table', 'customer_statement_periods');

    if (policyError) {
      console.error('❌ Error verifying policies:', policyError.message);
      return;
    }

    console.log('✅ RLS policies applied successfully!');
    console.log('\nCurrent policies on customer_statement_periods:');
    policies?.forEach(policy => {
      console.log(`- ${policy.name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixStatementPeriodsPolicies();