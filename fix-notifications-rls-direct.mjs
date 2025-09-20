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

async function fixNotificationsRLSDirect() {
  console.log('🔧 Fixing notifications RLS policies directly...');
  
  try {
    // Enable RLS on notifications table
    console.log('\n1. Enabling RLS on notifications table...');
    const { error: rlsError } = await supabaseAdmin.rpc('execute_sql', {
      query: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = 'notifications' 
            AND schemaname = 'public' 
            AND rowsecurity = true
          ) THEN
            ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
          END IF;
        END $$;
      `
    });
    
    if (rlsError) {
      console.log('⚠️  RLS enablement issue:', rlsError.message);
    } else {
      console.log('✅ RLS enabled on notifications table');
    }
    
    // Drop existing policies if they exist
    console.log('\n2. Cleaning up existing policies...');
    const policiesToDrop = [
      "Users can read their own notifications",
      "Users can insert notifications",
      "Users can update their own notifications",
      "Users can delete their own notifications"
    ];
    
    for (const policyName of policiesToDrop) {
      const { error: dropError } = await supabaseAdmin.rpc('execute_sql', {
        query: `DROP POLICY IF EXISTS "${policyName}" ON notifications;`
      });
      
      if (dropError) {
        console.log(`⚠️  Could not drop policy "${policyName}":`, dropError.message);
      } else {
        console.log(`✅ Policy "${policyName}" dropped if it existed`);
      }
    }
    
    // Create SELECT policy
    console.log('\n3. Creating SELECT policy...');
    const { error: selectError } = await supabaseAdmin.rpc('execute_sql', {
      query: `
        CREATE POLICY "Users can read their own notifications" 
        ON notifications 
        FOR SELECT 
        USING (recipient_id = auth.uid());
      `
    });
    
    if (selectError) {
      console.log('⚠️  SELECT policy creation failed:', selectError.message);
    } else {
      console.log('✅ SELECT policy created');
    }
    
    // Create INSERT policy
    console.log('\n4. Creating INSERT policy...');
    const { error: insertError } = await supabaseAdmin.rpc('execute_sql', {
      query: `
        CREATE POLICY "Users can insert notifications" 
        ON notifications 
        FOR INSERT 
        WITH CHECK (recipient_id = auth.uid() OR recipient_id IS NULL);
      `
    });
    
    if (insertError) {
      console.log('⚠️  INSERT policy creation failed:', insertError.message);
    } else {
      console.log('✅ INSERT policy created');
    }
    
    // Create UPDATE policy
    console.log('\n5. Creating UPDATE policy...');
    const { error: updateError } = await supabaseAdmin.rpc('execute_sql', {
      query: `
        CREATE POLICY "Users can update their own notifications" 
        ON notifications 
        FOR UPDATE 
        USING (recipient_id = auth.uid());
      `
    });
    
    if (updateError) {
      console.log('⚠️  UPDATE policy creation failed:', updateError.message);
    } else {
      console.log('✅ UPDATE policy created');
    }
    
    // Create DELETE policy
    console.log('\n6. Creating DELETE policy...');
    const { error: deleteError } = await supabaseAdmin.rpc('execute_sql', {
      query: `
        CREATE POLICY "Users can delete their own notifications" 
        ON notifications 
        FOR DELETE 
        USING (recipient_id = auth.uid());
      `
    });
    
    if (deleteError) {
      console.log('⚠️  DELETE policy creation failed:', deleteError.message);
    } else {
      console.log('✅ DELETE policy created');
    }
    
    // Grant permissions
    console.log('\n7. Granting permissions...');
    const { error: grantError } = await supabaseAdmin.rpc('execute_sql', {
      query: 'GRANT ALL ON notifications TO authenticated;'
    });
    
    if (grantError) {
      console.log('⚠️  Grant permissions failed:', grantError.message);
    } else {
      console.log('✅ Permissions granted to authenticated users');
    }
    
    // Verify the policies were created
    console.log('\n8. Verifying policies...');
    const { data: policies, error: verifyError } = await supabaseAdmin.rpc('execute_sql', {
      query: `
        SELECT policyname, permissive, roles, cmd 
        FROM pg_policy 
        JOIN pg_class ON pg_policy.polrelid = pg_class.oid 
        WHERE pg_class.relname = 'notifications'
        ORDER BY policyname;
      `
    });
    
    if (verifyError) {
      console.log('⚠️  Could not verify policies:', verifyError.message);
    } else {
      console.log('📋 Current policies on notifications table:');
      if (policies && policies.length > 0) {
        policies.forEach((policy, index) => {
          console.log(`  ${index + 1}. ${policy.policyname} (${policy.cmd})`);
        });
      } else {
        console.log('  No policies found');
      }
    }
    
    console.log('\n✅ RLS policies fix completed');
    console.log('\n📋 Next steps:');
    console.log('1. Test the notifications page: /dashboard/notifications');
    console.log('2. If issues persist, check the policies in Supabase dashboard');
    
  } catch (error) {
    console.error('❌ Error fixing RLS policies:', error);
  }
}

fixNotificationsRLSDirect().catch(console.error);