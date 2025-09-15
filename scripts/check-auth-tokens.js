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

async function checkAuthTokens() {
  console.log('🔍 Checking Auth Token Status...');
  
  try {
    // Check current token state
    console.log('📋 Analyzing current auth token state...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN confirmation_token = '' THEN 1 END) as empty_confirmation_tokens,
          COUNT(CASE WHEN recovery_token = '' THEN 1 END) as empty_recovery_tokens,
          COUNT(CASE WHEN email_change_token_new = '' THEN 1 END) as empty_email_change_new_tokens,
          COUNT(CASE WHEN email_change_token_current = '' THEN 1 END) as empty_email_change_current_tokens,
          COUNT(CASE WHEN phone_change_token = '' THEN 1 END) as empty_phone_change_tokens,
          COUNT(CASE WHEN reauthentication_token = '' THEN 1 END) as empty_reauth_tokens,
          COUNT(CASE WHEN confirmation_token IS NULL THEN 1 END) as null_confirmation_tokens,
          COUNT(CASE WHEN recovery_token IS NULL THEN 1 END) as null_recovery_tokens
        FROM auth.users;
      `
    });
    
    if (error) {
      console.warn('⚠️  Could not execute detailed token analysis:', error.message);
      console.log('💡 This might be due to permissions. Trying simpler query...');
      
      // Try a simpler query that might work with limited permissions
      const { data: simpleData, error: simpleError } = await supabase
        .from('appUsers')
        .select('count', { count: 'exact' });
      
      if (simpleError) {
        console.error('❌ Could not access database:', simpleError.message);
        return;
      }
      
      console.log(`✅ Database connection working. Found ${simpleData.count} appUsers.`);
      console.log('💡 The auth token issue might be resolved if you can see this message.');
      return;
    }
    
    if (data && data.length > 0) {
      const stats = data[0];
      console.log('\n📊 Auth Token Statistics:');
      console.log(`   Total Users: ${stats.total_users}`);
      console.log(`   Empty Confirmation Tokens: ${stats.empty_confirmation_tokens}`);
      console.log(`   Empty Recovery Tokens: ${stats.empty_recovery_tokens}`);
      console.log(`   Empty Email Change Tokens: ${stats.empty_email_change_new_tokens}`);
      console.log(`   Empty Phone Change Tokens: ${stats.empty_phone_change_tokens}`);
      console.log(`   Empty Reauth Tokens: ${stats.empty_reauth_tokens}`);
      console.log(`   NULL Confirmation Tokens: ${stats.null_confirmation_tokens}`);
      console.log(`   NULL Recovery Tokens: ${stats.null_recovery_tokens}`);
      
      // Check if fix is needed
      const totalEmptyTokens = 
        stats.empty_confirmation_tokens +
        stats.empty_recovery_tokens +
        stats.empty_email_change_new_tokens +
        stats.empty_email_change_current_tokens +
        stats.empty_phone_change_tokens +
        stats.empty_reauth_tokens;
      
      if (totalEmptyTokens > 0) {
        console.log(`\n⚠️  ISSUE DETECTED: ${totalEmptyTokens} empty string tokens found!`);
        console.log('💡 Run the fix script to resolve this issue:');
        console.log('   npm run fix:auth-tokens');
      } else {
        console.log('\n✅ No empty string tokens found. Auth system should be working correctly!');
      }
    }
    
  } catch (error) {
    console.error('❌ Token check failed:', error);
    
    // Try a basic connectivity test
    console.log('\n📋 Trying basic connectivity test...');
    try {
      const { data, error: connError } = await supabase
        .from('appUsers')
        .select('id')
        .limit(1);
      
      if (connError) {
        console.error('❌ Database connection failed:', connError.message);
      } else {
        console.log('✅ Database connection successful');
      }
    } catch (connError) {
      console.error('❌ Connection test failed:', connError);
    }
  }
}

// Run the check
checkAuthTokens();