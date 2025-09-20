import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugNotifications() {
  console.log('=== Debugging Notifications Access ===');
  
  // Check current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('Session error:', sessionError);
    return;
  }
  
  if (!session) {
    console.log('No active session');
    return;
  }
  
  console.log('User ID:', session.user.id);
  console.log('Session exists');
  
  // Try to get user role
  console.log('\n--- Checking User Role ---');
  const { data: userData, error: userError } = await supabase
    .from('appUsers')
    .select('id, email, name, primary_role, human_id, status')
    .eq('id', session.user.id)
    .single();
    
  if (userError) {
    console.error('Error fetching user data:', userError);
  } else {
    console.log('User data:', userData);
  }
  
  // Try to access notifications table
  console.log('\n--- Checking Notifications Access ---');
  const { data: notifications, error: notificationsError } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', session.user.id)
    .limit(5);
    
  if (notificationsError) {
    console.error('Error accessing notifications:', notificationsError);
    
    // Try a simpler query
    console.log('\n--- Trying Simple Notifications Query ---');
    const { data: simpleNotifications, error: simpleError } = await supabase
      .from('notifications')
      .select('id, title, message, created_at')
      .limit(1);
      
    if (simpleError) {
      console.error('Simple query also failed:', simpleError);
    } else {
      console.log('Simple query succeeded:', simpleNotifications);
    }
  } else {
    console.log('Notifications access successful:', notifications);
  }
  
  // Check if notifications table exists in database schema
  console.log('\n--- Checking Database Schema ---');
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'notifications');
    
  if (tablesError) {
    console.error('Error checking table schema:', tablesError);
  } else {
    console.log('Notifications table in schema:', tables.length > 0);
    if (tables.length > 0) {
      console.log('Table exists in schema');
    } else {
      console.log('Table does not exist in schema');
    }
  }
}

debugNotifications().catch(console.error);