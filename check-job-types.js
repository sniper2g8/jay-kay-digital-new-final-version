require('dotenv').config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJobTypes() {
  try {
    console.log('🔍 Checking job types in the database...');
    
    // Try to get distinct job_type values
    const { data, error } = await supabase
      .from('jobs')
      .select('job_type')
      .neq('job_type', null);
    
    if (error) {
      console.error('❌ Error checking job types:', error);
      return;
    }
    
    if (data && data.length > 0) {
      const jobTypes = [...new Set(data.map(job => job.job_type))];
      console.log('📋 Available job types:');
      jobTypes.forEach(type => console.log(`  - ${type}`));
    } else {
      console.log('📭 No job types found in existing data');
    }
    
    // Clean up the test job from previous test
    const { error: cleanupError } = await supabase
      .from('jobs')
      .delete()
      .eq('createdBy', 'comprehensive-test');
      
    if (cleanupError) {
      console.error('❌ Cleanup error:', cleanupError);
    } else {
      console.log('✅ Cleaned up test job');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

checkJobTypes().catch(console.error);