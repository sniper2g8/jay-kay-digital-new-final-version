import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local
const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUserAuthentication() {
  console.log('=== Checking User Authentication ===');
  
  try {
    // Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError.message);
      return;
    }
    
    if (!session) {
      console.log('ℹ️ No active session - user is not authenticated');
      return;
    }
    
    console.log('✅ User is authenticated');
    console.log('   User ID:', session.user.id);
    
    // Check user role by querying appUsers table
    console.log('1. Checking user role...');
    const { data: userData, error: userError } = await supabase
      .from('appUsers')
      .select('id, primary_role')
      .eq('id', session.user.id)
      .single();
      
    if (userError) {
      console.error('❌ Error fetching user data:', userError.message);
      return;
    }
    
    if (!userData) {
      console.log('ℹ️ User not found in appUsers table');
      return;
    }
    
    console.log('   User role:', userData.primary_role);
    
    // Test if user has proper role for jobs operations
    const allowedRoles = ['admin', 'staff', 'manager', 'super_admin'];
    const hasAllowedRole = allowedRoles.includes(userData.primary_role);
    
    console.log('   Has allowed role for jobs operations:', hasAllowedRole);
    
    if (!hasAllowedRole) {
      console.log('⚠️  User does not have an allowed role for jobs operations');
      console.log('   Allowed roles:', allowedRoles.join(', '));
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
  
  console.log('\n=== User Authentication Check Complete ===');
}

checkUserAuthentication().catch(console.error);