import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local
const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRLSWithSupabaseClient() {
  console.log('=== Checking RLS with Supabase Client ===');
  
  try {
    // Test 1: Check if we can access the jobs table at all
    console.log('1. Testing basic jobs table access...');
    const { data: testData, error: testError } = await supabase
      .from('jobs')
      .select('id')
      .limit(1);
      
    if (testError) {
      console.error('❌ Basic access failed:', testError);
    } else {
      console.log('✅ Basic access works');
    }
    
    // Test 2: Try to update a job (this is what's failing)
    console.log('2. Testing job update permission...');
    // First, find a job to test with
    const { data: jobs, error: fetchError } = await supabase
      .from('jobs')
      .select('id')
      .limit(1);
      
    if (fetchError) {
      console.error('❌ Could not fetch jobs for testing:', fetchError);
      return;
    }
    
    if (!jobs || jobs.length === 0) {
      console.log('ℹ️ No jobs found to test with');
      return;
    }
    
    const testJobId = jobs[0].id;
    console.log(`   Testing with job ID: ${testJobId}`);
    
    // Try to update the job
    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', testJobId);
      
    if (updateError) {
      console.error('❌ Job update failed:', updateError);
      
      // Check if it's a permission error
      if (updateError.code === '42501') {
        console.log('🚨 This is a PERMISSION DENIED error (RLS issue)');
        console.log('   RLS policies may not be configured correctly for the jobs table');
        console.log('   Recommendation: Enable RLS and add appropriate policies');
      }
    } else {
      console.log('✅ Job update works');
    }
    
    // Test 3: Check if we can insert a job (to test INSERT permissions)
    console.log('3. Testing job insert permission...');
    const { error: insertError } = await supabase
      .from('jobs')
      .insert({
        title: 'Test Job for RLS Check',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (insertError) {
      console.error('❌ Job insert failed:', insertError);
      
      // Check if it's a permission error
      if (insertError.code === '42501') {
        console.log('🚨 This is a PERMISSION DENIED error (RLS issue)');
        console.log('   INSERT RLS policies may not be configured correctly for the jobs table');
      }
    } else {
      console.log('✅ Job insert works');
      // Clean up the test job
      await supabase
        .from('jobs')
        .delete()
        .ilike('title', 'Test Job for RLS Check');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
  
  console.log('\n=== Supabase Client RLS Check Complete ===');
  console.log('\n💡 Recommendations:');
  console.log('   Based on the direct database connection check, RLS is not enabled on the jobs table');
  console.log('   You should enable RLS and add appropriate policies for:');
  console.log('   - SELECT (read operations)');
  console.log('   - INSERT (create operations)');
  console.log('   - UPDATE (edit operations)');
  console.log('   - DELETE (delete operations)');
  console.log('   Refer to the SQL files in this directory for examples');
}

checkRLSWithSupabaseClient().catch(console.error);