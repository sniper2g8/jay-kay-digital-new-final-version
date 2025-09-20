import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Use service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // Service role key for admin access
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function applyNotificationPolicies() {
  console.log('🔧 Applying RLS policies to notifications table...');
  
  try {
    // Check if we can access the notifications table with admin client
    console.log('\n1. Testing admin access to notifications table...');
    const { data: testData, error: testError } = await supabase
      .from('notifications')
      .select('count')
      .limit(1);
      
    if (testError) {
      console.error('❌ Admin access failed:', testError);
      return;
    }
    console.log('✅ Admin access works');
    
    // Enable RLS on notifications table
    console.log('\n2. Enabling RLS on notifications table...');
    // Note: We can't directly enable RLS through the JS client
    // This would typically be done through the SQL editor or dashboard
    console.log('ℹ️  RLS must be enabled through SQL editor or Supabase dashboard');
    console.log('   Run: ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;');
    
    // Since we can't directly create policies through the JS client,
    // we'll provide the SQL commands that need to be run
    console.log('\n3. RLS Policy SQL Commands (run these in Supabase SQL Editor):');
    console.log(`
-- Create policy for SELECT - users can read their own notifications
CREATE POLICY "Users can read their own notifications" 
ON notifications 
FOR SELECT 
USING (recipient_id = auth.uid());

-- Create policy for INSERT - users can insert notifications (typically done by system)
CREATE POLICY "Users can insert notifications" 
ON notifications 
FOR INSERT 
WITH CHECK (recipient_id = auth.uid() OR recipient_id IS NULL);

-- Create policy for UPDATE - users can update their own notifications
CREATE POLICY "Users can update their own notifications" 
ON notifications 
FOR UPDATE 
USING (recipient_id = auth.uid());

-- Create policy for DELETE - users can delete their own notifications
CREATE POLICY "Users can delete their own notifications" 
ON notifications 
FOR DELETE 
USING (recipient_id = auth.uid());
    `);
    
    console.log('\n✅ Policy application instructions provided');
    console.log('\n📋 Next steps:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the SQL commands above');
    console.log('4. Test the notifications page again');
    
  } catch (error) {
    console.error('❌ Error applying notification policies:', error);
  }
}

applyNotificationPolicies().catch(console.error);