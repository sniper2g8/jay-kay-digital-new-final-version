/**
 * Script to apply RLS policies directly using Supabase admin client
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

// Create admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyRLSPolicies() {
  console.log('🔧 Applying RLS policies directly...\n');
  
  // SQL statements to apply RLS policies
  const sqlStatements = [
    // Enable RLS on notifications table
    'ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;',
    
    // Drop existing policies
    'DROP POLICY IF EXISTS "Users can read their own notifications" ON notifications;',
    'DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;',
    'DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;',
    'DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;',
    
    // Create new policies for notifications
    `CREATE POLICY "Users can read their own notifications" 
     ON notifications 
     FOR SELECT 
     USING (recipient_id = auth.uid() OR recipient_id IS NULL);`,
     
    `CREATE POLICY "Users can insert notifications" 
     ON notifications 
     FOR INSERT 
     WITH CHECK (recipient_id = auth.uid() OR recipient_id IS NULL);`,
     
    `CREATE POLICY "Users can update their own notifications" 
     ON notifications 
     FOR UPDATE 
     USING (recipient_id = auth.uid());`,
     
    `CREATE POLICY "Users can delete their own notifications" 
     ON notifications 
     FOR DELETE 
     USING (recipient_id = auth.uid());`,
     
    // Enable RLS on appUsers table
    'ALTER TABLE appUsers ENABLE ROW LEVEL SECURITY;',
    
    // Drop existing policies
    'DROP POLICY IF EXISTS "Users can read their own profile" ON appUsers;',
    'DROP POLICY IF EXISTS "Users can update their own profile" ON appUsers;',
    
    // Create new policies for appUsers
    `CREATE POLICY "Users can read their own profile" 
     ON appUsers 
     FOR SELECT 
     USING (id = auth.uid());`,
     
    `CREATE POLICY "Users can update their own profile" 
     ON appUsers 
     FOR UPDATE 
     USING (id = auth.uid());`,
     
    // Enable RLS on notification_preferences table
    'ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;',
    
    // Drop existing policies
    'DROP POLICY IF EXISTS "Users can read their own preferences" ON notification_preferences;',
    'DROP POLICY IF EXISTS "Users can update their own preferences" ON notification_preferences;',
    
    // Create new policies for notification_preferences
    `CREATE POLICY "Users can read their own preferences" 
     ON notification_preferences 
     FOR SELECT 
     USING (user_id = auth.uid());`,
     
    `CREATE POLICY "Users can update their own preferences" 
     ON notification_preferences 
     FOR UPDATE 
     USING (user_id = auth.uid());`,
     
    // Grant necessary permissions
    'GRANT ALL ON TABLE notifications TO authenticated;',
    'GRANT ALL ON TABLE appUsers TO authenticated;',
    'GRANT ALL ON TABLE notification_preferences TO authenticated;'
  ];
  
  // Execute each SQL statement
  for (let i = 0; i < sqlStatements.length; i++) {
    const statement = sqlStatements[i];
    console.log(`Executing statement ${i + 1}/${sqlStatements.length}...`);
    
    try {
      // Since we can't use rpc('execute_sql') reliably, we'll try a different approach
      // We'll use the admin client to directly manipulate the tables
      console.log('  Statement:', statement.substring(0, 50) + '...');
      
      // For now, we'll just log the statements since direct SQL execution
      // through the JS client is limited
      console.log('  ✅ Statement prepared (needs manual execution in Supabase dashboard)');
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n📋 RLS policies prepared!');
  console.log('\nTo apply these policies:');
  console.log('1. Copy the SQL statements from fix-all-rls-policies.sql');
  console.log('2. Paste them into the Supabase SQL Editor');
  console.log('3. Run the query');
  console.log('4. Restart your Next.js development server');
}

applyRLSPolicies().catch(console.error);