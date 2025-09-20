import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Use service role key for admin access
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

async function applyNotificationsRLSFix() {
  console.log('🔧 Applying RLS policies to notifications table...');
  
  try {
    // Enable RLS on notifications table
    console.log('\n1. Enabling RLS on notifications table...');
    const enableRLS = await supabaseAdmin.rpc('execute_sql', {
      query: 'ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;'
    });
    
    if (enableRLS.error) {
      console.log('ℹ️  RLS may already be enabled or requires manual enablement through Supabase dashboard');
    } else {
      console.log('✅ RLS enabled on notifications table');
    }
    
    // Create SELECT policy
    console.log('\n2. Creating SELECT policy...');
    const selectPolicy = await supabaseAdmin.rpc('execute_sql', {
      query: `
        CREATE POLICY "Users can read their own notifications" 
        ON notifications 
        FOR SELECT 
        USING (recipient_id = auth.uid());
      `
    });
    
    if (selectPolicy.error) {
      console.log('ℹ️  SELECT policy may already exist or requires manual creation');
    } else {
      console.log('✅ SELECT policy created');
    }
    
    // Create INSERT policy
    console.log('\n3. Creating INSERT policy...');
    const insertPolicy = await supabaseAdmin.rpc('execute_sql', {
      query: `
        CREATE POLICY "Users can insert notifications" 
        ON notifications 
        FOR INSERT 
        WITH CHECK (recipient_id = auth.uid() OR recipient_id IS NULL);
      `
    });
    
    if (insertPolicy.error) {
      console.log('ℹ️  INSERT policy may already exist or requires manual creation');
    } else {
      console.log('✅ INSERT policy created');
    }
    
    // Create UPDATE policy
    console.log('\n4. Creating UPDATE policy...');
    const updatePolicy = await supabaseAdmin.rpc('execute_sql', {
      query: `
        CREATE POLICY "Users can update their own notifications" 
        ON notifications 
        FOR UPDATE 
        USING (recipient_id = auth.uid());
      `
    });
    
    if (updatePolicy.error) {
      console.log('ℹ️  UPDATE policy may already exist or requires manual creation');
    } else {
      console.log('✅ UPDATE policy created');
    }
    
    // Create DELETE policy
    console.log('\n5. Creating DELETE policy...');
    const deletePolicy = await supabaseAdmin.rpc('execute_sql', {
      query: `
        CREATE POLICY "Users can delete their own notifications" 
        ON notifications 
        FOR DELETE 
        USING (recipient_id = auth.uid());
      `
    });
    
    if (deletePolicy.error) {
      console.log('ℹ️  DELETE policy may already exist or requires manual creation');
    } else {
      console.log('✅ DELETE policy created');
    }
    
    // Verify the policies were created
    console.log('\n6. Verifying policies...');
    const verifyPolicies = await supabaseAdmin.rpc('execute_sql', {
      query: `
        SELECT policyname, permissive, roles, cmd 
        FROM pg_policy 
        JOIN pg_class ON pg_policy.polrelid = pg_class.oid 
        WHERE pg_class.relname = 'notifications';
      `
    });
    
    if (verifyPolicies.error) {
      console.log('ℹ️  Could not verify policies directly');
    } else {
      console.log('📋 Current policies on notifications table:');
      verifyPolicies.data.forEach((policy, index) => {
        console.log(`  ${index + 1}. ${policy.policyname} (${policy.cmd})`);
      });
    }
    
    console.log('\n✅ RLS policies application completed');
    console.log('\n📋 Next steps:');
    console.log('1. Test the notifications page: /dashboard/notifications');
    console.log('2. If issues persist, check the policies in Supabase dashboard');
    console.log('3. Ensure recipient_id column is properly populated in notifications');
    
  } catch (error) {
    console.error('❌ Error applying RLS policies:', error);
  }
}

applyNotificationsRLSFix().catch(console.error);