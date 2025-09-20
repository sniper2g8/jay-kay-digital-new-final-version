import dotenv from 'dotenv';
import { Client } from 'pg';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function verifyNotificationsRLS() {
  const client = new Client({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');

    // Check if RLS is enabled on notifications table
    console.log('\n=== Checking RLS status on notifications table ===');
    const rlsCheck = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = 'notifications';
    `);
    
    if (rlsCheck.rows.length === 0) {
      console.log('❌ Notifications table not found');
      return;
    }
    
    const rlsEnabled = rlsCheck.rows[0].rowsecurity;
    console.log(`📋 RLS status: ${rlsEnabled ? 'ENABLED' : 'DISABLED'}`);
    
    if (!rlsEnabled) {
      console.log('⚠️  RLS is not enabled on the notifications table');
      console.log('💡 Run this SQL command to enable it:');
      console.log('   ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;');
    }

    // Check existing policies on notifications table
    console.log('\n=== Checking existing policies on notifications table ===');
    const policyCheck = await client.query(`
      SELECT policyname, permissive, roles, cmd, qual, with_check 
      FROM pg_policy 
      JOIN pg_class ON pg_policy.polrelid = pg_class.oid 
      WHERE pg_class.relname = 'notifications';
    `);
    
    if (policyCheck.rows.length === 0) {
      console.log('❌ No policies found on notifications table');
      console.log('💡 You need to create RLS policies. Run the SQL commands from fix-notifications-rls-policies.sql');
    } else {
      console.log(`📋 Found ${policyCheck.rows.length} policies:`);
      policyCheck.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.policyname} (${row.cmd})`);
        if (row.qual) console.log(`     USING: ${row.qual}`);
        if (row.with_check) console.log(`     WITH CHECK: ${row.with_check}`);
      });
      
      // Check if we have the required policies
      const policyNames = policyCheck.rows.map(row => row.policyname);
      const requiredPolicies = [
        'Users can read their own notifications',
        'Users can insert notifications',
        'Users can update their own notifications',
        'Users can delete their own notifications'
      ];
      
      console.log('\n=== Policy Compliance Check ===');
      requiredPolicies.forEach(policy => {
        if (policyNames.includes(policy)) {
          console.log(`✅ ${policy}`);
        } else {
          console.log(`❌ ${policy} - MISSING`);
        }
      });
    }

    // Check table structure
    console.log('\n=== Notifications Table Structure ===');
    const structureCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'notifications' AND table_schema = 'public' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Columns:');
    structureCheck.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.column_name}: ${row.data_type} ${row.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    // Check if recipient_id column exists
    const hasRecipientId = structureCheck.rows.some(row => row.column_name === 'recipient_id');
    if (hasRecipientId) {
      console.log('✅ recipient_id column exists');
    } else {
      console.log('❌ recipient_id column is missing - this is required for RLS policies');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

verifyNotificationsRLS().catch(console.error);