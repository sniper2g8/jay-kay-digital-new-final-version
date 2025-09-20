#!/usr/bin/env node

/**
 * Comprehensive debug script for notification service
 * Tests each component of the notification system
 */

import { createServiceRoleClient } from './src/lib/supabase-admin.ts';
import { supabase } from './src/lib/supabase.ts';

async function testSupabaseConnections() {
  console.log('Testing Supabase connections...');
  
  try {
    // Test regular Supabase client
    console.log('1. Testing regular Supabase client...');
    const { data: regularData, error: regularError } = await supabase
      .from('appUsers')
      .select('count()')
      .limit(1);
    
    if (regularError) {
      console.error('❌ Regular Supabase client error:', regularError);
    } else {
      console.log('✅ Regular Supabase client working');
    }
    
    // Test service role client
    console.log('2. Testing service role client...');
    const adminSupabase = createServiceRoleClient();
    const { data: adminData, error: adminError } = await adminSupabase
      .from('appUsers')
      .select('count()')
      .limit(1);
    
    if (adminError) {
      console.error('❌ Service role client error:', adminError);
    } else {
      console.log('✅ Service role client working');
    }
    
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error);
  }
}

async function testEnvironmentVariables() {
  console.log('\nTesting environment variables...');
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`✅ ${envVar}: Set`);
    } else {
      console.error(`❌ ${envVar}: Missing`);
    }
  }
}

async function testDatabaseTables() {
  console.log('\nTesting database table access...');
  
  try {
    const adminSupabase = createServiceRoleClient();
    
    // Test notifications table
    console.log('1. Testing notifications table...');
    const { data: notificationsData, error: notificationsError } = await adminSupabase
      .from('notifications')
      .select('count()')
      .limit(1);
    
    if (notificationsError) {
      console.error('❌ Notifications table access error:', notificationsError);
    } else {
      console.log('✅ Notifications table accessible');
    }
    
    // Test appUsers table
    console.log('2. Testing appUsers table...');
    const { data: appUsersData, error: appUsersError } = await adminSupabase
      .from('appUsers')
      .select('count()')
      .limit(1);
    
    if (appUsersError) {
      console.error('❌ appUsers table access error:', appUsersError);
    } else {
      console.log('✅ appUsers table accessible');
    }
    
    // Test notification_preferences table
    console.log('3. Testing notification_preferences table...');
    const { data: preferencesData, error: preferencesError } = await adminSupabase
      .from('notification_preferences')
      .select('count()')
      .limit(1);
    
    if (preferencesError) {
      console.error('❌ notification_preferences table access error:', preferencesError);
    } else {
      console.log('✅ notification_preferences table accessible');
    }
    
  } catch (error) {
    console.error('❌ Database table test failed:', error);
  }
}

async function main() {
  console.log('Running comprehensive notification debug...\n');
  
  await testEnvironmentVariables();
  await testSupabaseConnections();
  await testDatabaseTables();
  
  console.log('\n' + '='.repeat(50));
  console.log('Debug complete. Check output above for any errors.');
  console.log('If all tests pass, the issue may be in the API route implementation.');
}

main().catch(console.error);