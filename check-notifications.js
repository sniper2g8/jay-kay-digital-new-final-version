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

async function checkNotifications() {
  console.log('Checking notifications table...');
  
  // Check if notifications table exists by querying it
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error querying notifications table:', error);
    return;
  }
  
  console.log('Notifications table exists and is accessible');
  console.log('Sample data:', data);
}

checkNotifications().catch(console.error);