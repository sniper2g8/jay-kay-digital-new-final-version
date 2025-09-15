const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testAuthQueries() {
  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Testing authentication queries...\n');

    // Test 1: Check auth.users table structure
    console.log('=== Testing auth.users access ===');
    try {
      const authUsersTest = await client.query(`
        SELECT 
          id, 
          email, 
          email_confirmed_at,
          confirmation_token,
          recovery_token,
          email_change_token_new,
          email_change_token_current,
          phone_change_token
        FROM auth.users 
        LIMIT 3
      `);
      console.log(`✓ Found ${authUsersTest.rows.length} users in auth.users`);
      
      // Check for any remaining empty string tokens
      authUsersTest.rows.forEach((user, index) => {
        console.log(`User ${index + 1}:`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Confirmation Token: ${user.confirmation_token === '' ? 'EMPTY STRING (BAD)' : user.confirmation_token || 'NULL (GOOD)'}`);
        console.log(`  Recovery Token: ${user.recovery_token === '' ? 'EMPTY STRING (BAD)' : user.recovery_token || 'NULL (GOOD)'}`);
      });
      
    } catch (error) {
      console.log('❌ Error accessing auth.users:', error.message);
    }

    // Test 2: Check appUsers table
    console.log('\n=== Testing appUsers access ===');
    try {
      const appUsersTest = await client.query(`
        SELECT 
          id, 
          name, 
          email, 
          primary_role,
          created_at
        FROM public."appUsers" 
        ORDER BY created_at DESC
        LIMIT 5
      `);
      console.log(`✓ Found ${appUsersTest.rows.length} users in appUsers`);
      appUsersTest.rows.forEach((user, index) => {
        console.log(`User ${index + 1}: ${user.name} (${user.email}) - Role: ${user.primary_role}`);
      });
      
    } catch (error) {
      console.log('❌ Error accessing appUsers:', error.message);
    }

    // Test 3: Test join between auth.users and appUsers
    console.log('\n=== Testing auth.users + appUsers join ===');
    try {
      const joinTest = await client.query(`
        SELECT 
          au.email,
          app.name,
          app.primary_role,
          au.email_confirmed_at
        FROM auth.users au
        LEFT JOIN public."appUsers" app ON au.email = app.email
        WHERE app.email IS NOT NULL
        LIMIT 5
      `);
      console.log(`✓ Successfully joined ${joinTest.rows.length} users`);
      joinTest.rows.forEach((user, index) => {
        console.log(`Joined User ${index + 1}: ${user.name} (${user.email}) - Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
      });
      
    } catch (error) {
      console.log('❌ Error in join query:', error.message);
    }

    console.log('\n🎉 Authentication query tests completed!');

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    try {
      await client.end();
    } catch (error) {
      // Ignore connection cleanup errors
    }
  }
}

testAuthQueries().catch(console.error);