import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Regular client (authenticated user)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
);

// Admin client (service role)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function testNotificationsAccess() {
  console.log('🧪 Testing notifications access...\n');
  
  try {
    // Test 1: Admin access
    console.log('1. Testing admin access...');
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('notifications')
      .select('count')
      .limit(1);
      
    if (adminError) {
      console.log('❌ Admin access failed:', adminError.message);
    } else {
      console.log('✅ Admin access works');
    }
    
    // Test 2: Try to sign in a user (if we have test credentials)
    console.log('\n2. Testing authenticated user access...');
    
    // This would require actual user credentials
    // For now, we'll just show what the test would look like
    console.log('ℹ️  To test authenticated user access, you would need to sign in with a real user account');
    console.log('   and then try to access notifications with that session.');
    
    // Example of what the user access test would look like:
    console.log('\n   Example code for user access test:');
    console.log('   const { data: { session } } = await supabase.auth.signInWithPassword({');
    console.log('     email: "test@example.com",');
    console.log('     password: "testpassword"');
    console.log('   });');
    console.log('');
    console.log('   const { data, error } = await supabase');
    console.log('     .from("notifications")');
    console.log('     .select("*")');
    console.log('     .eq("recipient_id", session.user.id)');
    console.log('     .order("created_at", { ascending: false });');
    
    console.log('\n✅ Tests completed');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

testNotificationsAccess().catch(console.error);