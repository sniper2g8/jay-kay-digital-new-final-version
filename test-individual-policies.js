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

async function testIndividualPolicies() {
  console.log('=== Testing Individual Policies ===');
  
  try {
    // Test SELECT policy
    console.log('1. Testing SELECT policy...');
    const { data: selectData, error: selectError } = await supabase
      .from('jobs')
      .select('id')
      .limit(1);
      
    if (selectError) {
      console.error('❌ SELECT failed:', selectError.message);
    } else {
      console.log('✅ SELECT works');
    }
    
    // Test INSERT policy
    console.log('2. Testing INSERT policy...');
    const { data: insertData, error: insertError } = await supabase
      .from('jobs')
      .insert({
        title: 'Test Job for Policy Check',
        status: 'pending',
        customer_id: '00000000-0000-0000-0000-000000000000', // Dummy customer ID
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id');
      
    if (insertError) {
      console.error('❌ INSERT failed:', insertError.message);
      console.error('   Code:', insertError.code);
    } else {
      console.log('✅ INSERT works');
      // Clean up test job
      if (insertData && insertData.length > 0) {
        await supabase
          .from('jobs')
          .delete()
          .eq('id', insertData[0].id);
      }
    }
    
    // Test UPDATE policy
    console.log('3. Testing UPDATE policy...');
    // First, find a job to test with
    const { data: jobs, error: fetchError } = await supabase
      .from('jobs')
      .select('id')
      .limit(1);
      
    if (fetchError) {
      console.error('❌ Could not fetch jobs for testing:', fetchError.message);
    } else if (!jobs || jobs.length === 0) {
      console.log('ℹ️ No jobs found to test with');
    } else {
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
        console.error('❌ UPDATE failed:', updateError.message);
        console.error('   Code:', updateError.code);
      } else {
        console.log('✅ UPDATE works');
      }
    }
    
    // Test DELETE policy
    console.log('4. Testing DELETE policy...');
    // Create a test job to delete
    const { data: testData, error: testError } = await supabase
      .from('jobs')
      .insert({
        title: 'Test Job for Delete Check',
        status: 'pending',
        customer_id: '00000000-0000-0000-0000-000000000000', // Dummy customer ID
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id');
      
    if (testError) {
      console.error('❌ Could not create test job for DELETE:', testError.message);
    } else if (testData && testData.length > 0) {
      const testJobId = testData[0].id;
      console.log(`   Testing DELETE with job ID: ${testJobId}`);
      
      // Try to delete the job
      const { error: deleteError } = await supabase
        .from('jobs')
        .delete()
        .eq('id', testJobId);
        
      if (deleteError) {
        console.error('❌ DELETE failed:', deleteError.message);
        console.error('   Code:', deleteError.code);
      } else {
        console.log('✅ DELETE works');
      }
    } else {
      console.log('ℹ️ Could not create test job for DELETE test');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
  
  console.log('\n=== Individual Policy Test Complete ===');
}

testIndividualPolicies().catch(console.error);