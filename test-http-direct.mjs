import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testHttpExtension() {
  console.log('🔍 Testing HTTP extension directly...');
  
  try {
    // Test if we can make a simple query to check if the extension exists
    const { data, error } = await supabase.rpc('extensions.http_get', {
      url: 'https://httpbin.org/get'
    });
    
    if (error) {
      console.log('❌ HTTP extension test failed:', error);
      // Let's try a different approach - check if the extensions schema exists
      const { data: schemaData, error: schemaError } = await supabase
        .from('information_schema.schemata')
        .select('schema_name')
        .eq('schema_name', 'extensions');
      
      if (schemaError) {
        console.log('❌ Error checking extensions schema:', schemaError);
      } else if (schemaData && schemaData.length > 0) {
        console.log('✅ Extensions schema exists');
        // Try to check if http extension is installed
        const { data: extData, error: extError } = await supabase
          .from('pg_extension')
          .select('extname')
          .eq('extname', 'http');
        
        if (extError) {
          console.log('❌ Error checking http extension:', extError);
        } else if (extData && extData.length > 0) {
          console.log('✅ HTTP extension is installed');
        } else {
          console.log('❌ HTTP extension is not installed');
        }
      } else {
        console.log('❌ Extensions schema does not exist');
      }
    } else {
      console.log('✅ HTTP extension is working!');
      console.log('Response:', data);
    }
  } catch (err) {
    console.log('❌ Error testing HTTP extension:', err.message);
  }
}

testHttpExtension();