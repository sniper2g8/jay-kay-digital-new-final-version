const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.pnoxqzlxfuvjvufdjuqh:delsenterprise123@aws-0-us-east-1.pooler.supabase.com:6543/postgres'
});

async function checkRLSAndTriggers() {
  try {
    await client.connect();
    console.log('🔍 Checking RLS Policies and Triggers\n');
    
    // Check RLS policies on key tables
    console.log('=== RLS Policies ===');
    const rlsQuery = `
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname IN ('public', 'auth') 
      AND tablename IN ('appUsers', 'users', 'profiles')
      ORDER BY schemaname, tablename;
    `;
    
    const rlsResult = await client.query(rlsQuery);
    console.log('Tables with RLS:');
    rlsResult.rows.forEach(row => {
      console.log(`${row.schemaname}.${row.tablename}: RLS ${row.rowsecurity ? 'ENABLED' : 'DISABLED'}`);
    });
    
    // Check if there are any policies on appUsers
    console.log('\n=== Policies on appUsers table ===');
    const policiesQuery = `
      SELECT pol.polname, pol.polcmd, pol.polroles, pol.polqual, pol.polwithcheck
      FROM pg_policy pol
      JOIN pg_class pc ON pol.polrelid = pc.oid
      JOIN pg_namespace pn ON pc.relnamespace = pn.oid
      WHERE pn.nspname = 'public' AND pc.relname = 'appUsers';
    `;
    
    const policiesResult = await client.query(policiesQuery);
    if (policiesResult.rows.length === 0) {
      console.log('❌ No policies found on appUsers table');
      console.log('This might be blocking user access!');
    } else {
      console.log('Policies found:');
      policiesResult.rows.forEach(policy => {
        console.log(`- ${policy.polname}: ${policy.polcmd}`);
      });
    }
    
    // Check our auth triggers
    console.log('\n=== Auth Triggers Status ===');
    const triggersQuery = `
      SELECT t.tgname, c.relname, t.tgenabled
      FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = 'auth' AND c.relname = 'users'
      AND t.tgname LIKE '%auth_token%';
    `;
    
    const triggersResult = await client.query(triggersQuery);
    console.log('Auth triggers:');
    triggersResult.rows.forEach(trigger => {
      console.log(`- ${trigger.tgname}: ${trigger.tgenabled ? 'ENABLED' : 'DISABLED'}`);
    });
    
    // Check if appUsers table exists and has the right structure
    console.log('\n=== appUsers Table Structure ===');
    const tableQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'appUsers'
      ORDER BY ordinal_position;
    `;
    
    const tableResult = await client.query(tableQuery);
    if (tableResult.rows.length === 0) {
      console.log('❌ appUsers table not found!');
    } else {
      console.log('appUsers columns:');
      tableResult.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkRLSAndTriggers();