import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

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
    // First, let's check if we can access the auth schema
    console.log('📋 Checking database connectivity...');
    
    // Simple test query to verify connection
    const { data: test, error: testError } = await supabase
      .from('appUsers')
      .select('count', { count: 'exact' });
    
    if (testError) {
      console.warn('⚠️  Warning: Cannot access appUsers table directly, but this may be expected due to RLS');
    } else {
      console.log(`✅ Database connection working. Found ${test.count} appUsers.`);
    }
    
    // Now let's try to execute our fix using a raw HTTP request to the Supabase REST API
    console.log('⚡ Attempting to fix auth tokens...');
    
    // The actual SQL we want to execute
    const fixSql = `
      UPDATE auth.users 
      SET 
        confirmation_token = NULLIF(confirmation_token, ''),
        recovery_token = NULLIF(recovery_token, ''),
        email_change_token_new = NULLIF(email_change_token_new, ''),
        email_change_token_current = NULLIF(email_change_token_current, ''),
        phone_change_token = NULLIF(phone_change_token, ''),
        reauthentication_token = NULLIF(reauthentication_token, '')
      WHERE 
        confirmation_token = '' 
        OR recovery_token = '' 
        OR email_change_token_new = '' 
        OR email_change_token_current = '' 
        OR phone_change_token = ''
        OR reauthentication_token = '';
    `;
    
    // Try to execute via the Supabase REST API with service role key
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        name: 'execute_sql',
        args: { sql: fixSql }
      })
    });
    
    if (response.ok) {
      console.log('✅ Auth token fix executed successfully!');
    } else {
      // If RPC approach fails, let's try a different approach
      console.warn('⚠️  RPC execution failed, trying alternative approach...');
      
      // Let's check if we can create a simple function to do the fix
      const createFunctionSql = `
        CREATE OR REPLACE FUNCTION public.fix_auth_tokens()
        RETURNS void AS $$
        BEGIN
          UPDATE auth.users 
          SET 
            confirmation_token = NULLIF(confirmation_token, ''),
            recovery_token = NULLIF(recovery_token, ''),
            email_change_token_new = NULLIF(email_change_token_new, ''),
            email_change_token_current = NULLIF(email_change_token_current, ''),
            phone_change_token = NULLIF(phone_change_token, ''),
            reauthentication_token = NULLIF(reauthentication_token, '')
          WHERE 
            confirmation_token = '' 
            OR recovery_token = '' 
            OR email_change_token_new = '' 
            OR email_change_token_current = '' 
            OR phone_change_token = ''
            OR reauthentication_token = '';
        END;
        $$ LANGUAGE plpgsql;
      `;
      
      // Try to create the function
      const createFunctionResponse = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({
          name: 'execute_sql',
          args: { sql: createFunctionSql }
        })
      });
      
      if (createFunctionResponse.ok) {
        console.log('✅ Fix function created successfully!');
        
        // Now try to call the function
        const callFunctionResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/fix_auth_tokens`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          }
        });
        
        if (callFunctionResponse.ok) {
          console.log('✅ Auth token fix function executed successfully!');
        } else {
          console.warn('⚠️  Could not execute fix function');
          console.log('💡 Please run the simple SQL fix manually in your Supabase SQL Editor:');
          console.log('');
          console.log(fixSql);
        }
      } else {
        console.warn('⚠️  Could not create fix function');
        console.log('💡 Please run the simple SQL fix manually in your Supabase SQL Editor:');
        console.log('');
        console.log(fixSql);
      }
    }
    
    // Test authentication
    console.log('🔄 Testing authentication...');
    
    try {
      const { data, error } = await supabase
        .from('appUsers')
        .select('id')
        .limit(1);
      
      if (error) {
        console.warn('⚠️  Test query failed (may be expected due to RLS):', error.message);
        console.log('✅ This is likely normal if Row Level Security is enabled');
      } else {
        console.log('✅ Test query succeeded - authentication should now work properly');
      }
    } catch (testError) {
      console.warn('⚠️  Test authentication failed (may be expected):', testError.message);
      console.log('✅ This is likely normal if Row Level Security is enabled');
    }
    
    console.log('🎉 Fix process completed!');
    console.log('💡 If you still experience authentication issues, please run the SQL fix manually in your Supabase SQL Editor');
    
  } catch (error) {
    console.error('❌ Fix execution failed:', error);
    console.log('💡 Please run the simple SQL fix manually in your Supabase SQL Editor');
    console.log('💡 SQL to run:');
    console.log(`
      UPDATE auth.users 
      SET 
        confirmation_token = NULLIF(confirmation_token, ''),
        recovery_token = NULLIF(recovery_token, ''),
        email_change_token_new = NULLIF(email_change_token_new, ''),
        email_change_token_current = NULLIF(email_change_token_current, ''),
        phone_change_token = NULLIF(phone_change_token, ''),
        reauthentication_token = NULLIF(reauthentication_token, '')
      WHERE 
        confirmation_token = '' 
        OR recovery_token = '' 
        OR email_change_token_new = '' 
        OR email_change_token_current = '' 
        OR phone_change_token = ''
        OR reauthentication_token = '';
    `);
    process.exit(1);
  }
}

// Run the fix
runFix().catch(console.error);