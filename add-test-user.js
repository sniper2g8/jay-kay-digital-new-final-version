const { Pool } = require('pg');

const pool = new Pool({
  host: 'aws-1-eu-west-2.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.pnoxqzlxfuvjvufdjuqh',
  password: '...()Admin@1',
  ssl: { rejectUnauthorized: false }
});

async function addTestUserToAppUsers() {
  console.log('👤 Adding test user to appUsers table...');
  
  try {
    // Get the UUID for customer role
    const roleResult = await pool.query('SELECT id FROM roles WHERE name = $1', ['customer']);
    const customerRoleId = roleResult.rows[0]?.id;
    
    if (!customerRoleId) {
      console.error('❌ Customer role not found');
      return;
    }
    
    console.log('✅ Customer role ID:', customerRoleId);
    
    // Add test user to appUsers
    const insertQuery = `
      INSERT INTO "appUsers" (
        id, email, name, human_id, primary_role, status, created_at, updated_at, last_role_update
      ) VALUES (
        $1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        primary_role = EXCLUDED.primary_role,
        updated_at = NOW()
    `;
    
    const values = [
      'c01328ab-c136-49d9-8b12-4d43d8ae8bb0', // User ID from earlier creation
      'testuser@confirmed.com',
      'Test User for File Upload',
      'JKDP-TST-001',
      'customer',
      'active'
    ];
    
    await pool.query(insertQuery, values);
    console.log('✅ Test user added to appUsers table');
    
    // Verify the addition
    const verifyResult = await pool.query(
      'SELECT * FROM "appUsers" WHERE email = $1', 
      ['testuser@confirmed.com']
    );
    
    if (verifyResult.rows.length > 0) {
      console.log('✅ Verification successful:');
      console.log(JSON.stringify(verifyResult.rows[0], null, 2));
    } else {
      console.error('❌ User not found after insertion');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

addTestUserToAppUsers();