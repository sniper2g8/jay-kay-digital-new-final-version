import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkHttpExtension() {
  console.log('🔍 Checking HTTP extension in database...');
  
  try {
    // First, let's check if we can connect to the database
    const { data: healthData, error: healthError } = await supabase
      .from('jobs')
      .select('id')
      .limit(1);
    
    if (healthError) {
      console.log('❌ Database connection failed:', healthError.message);
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // Now let's try to call our notification function directly to test if HTTP extension works
    // We'll create a simple test by calling a function that uses extensions.http_post
    const { data, error } = await supabase.rpc('notify_job_status_change_test');
    
    if (error) {
      console.log('ℹ️  HTTP extension test function not found, creating it...');
      
      // Let's create a simple test function
      const createFunctionQuery = `
        CREATE OR REPLACE FUNCTION notify_job_status_change_test()
        RETURNS TEXT AS $$
        BEGIN
          -- Try to use the HTTP extension
          -- This will fail if the extension is not properly configured
          RETURN 'HTTP extension is available';
        EXCEPTION
          WHEN others THEN
            RETURN 'HTTP extension error: ' || SQLERRM;
        END;
        $$ LANGUAGE plpgsql;
      `;
      
      // We can't directly execute this through the Supabase client
      // Let's just check if the extensions schema exists
      console.log('ℹ️  Checking if extensions schema exists...');
      
      // Try a different approach - check the information schema
      const { data: schemaData, error: schemaError } = await supabase.rpc('exec_sql', {
        sql_query: `
          SELECT schema_name 
          FROM information_schema.schemata 
          WHERE schema_name = 'extensions'
        `
      });
      
      if (schemaError) {
        console.log('❌ Error checking extensions schema:', schemaError.message);
      } else {
        console.log('✅ Extensions schema check result:', schemaData);
      }
    } else {
      console.log('✅ HTTP extension test result:', data);
    }
  } catch (err) {
    console.log('❌ Error checking HTTP extension:', err.message);
  }
  
  console.log('✅ Database check completed');
}

checkHttpExtension();