const { Pool } = require('pg');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./supabase-service.json', 'utf8'));
const pool = new Pool(config);

async function analyzeRolesFinal() {
  try {
    const client = await pool.connect();
    
    console.log('=== ROLES vs UNIFIED_USER_ROLES - FINAL ANALYSIS ===\n');
    
    // Check what exists
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('roles', 'unified_user_roles')
    `);
    
    const views = await client.query(`
      SELECT table_name
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name = 'unified_user_roles'
    `);
    
    const existingTables = tables.rows.map(r => r.table_name);
    const existingViews = views.rows.map(r => r.table_name);
    
    console.log('1. EXISTENCE CHECK:');
    console.log(`   📋 roles table: ${existingTables.includes('roles') ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    console.log(`   📋 unified_user_roles table: ${existingTables.includes('unified_user_roles') ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    console.log(`   👁️ unified_user_roles view: ${existingViews.includes('unified_user_roles') ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    
    // ROLES TABLE ANALYSIS
    console.log('\n2. ROLES TABLE (Master Role Definitions):');
    
    const rolesStructure = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'roles' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('   📋 Structure:');
    rolesStructure.rows.forEach(col => {
      console.log(`   ${col.column_name.padEnd(20)} ${col.data_type}`);
    });
    
    // Get roles data without assuming column names
    const rolesData = await client.query('SELECT * FROM roles ORDER BY name');
    console.log(`\n   📊 Role Definitions (${rolesData.rows.length} roles):`);
    rolesData.rows.forEach(role => {
      console.log(`   ${role.name.padEnd(15)} - ${role.description || role.display_name || 'No description'}`);
    });
    
    // UNIFIED_USER_ROLES ANALYSIS
    if (existingViews.includes('unified_user_roles')) {
      console.log('\n3. UNIFIED_USER_ROLES VIEW (User-Role Combination):');
      
      const viewDefinition = await client.query(`
        SELECT definition
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND viewname = 'unified_user_roles'
      `);
      
      console.log('   📋 View Definition:');
      console.log(`   ${viewDefinition.rows[0]?.definition}`);
      
      try {
        const viewSample = await client.query('SELECT * FROM unified_user_roles LIMIT 5');
        console.log(`\n   📊 Sample User-Role Data (${viewSample.rows.length} records):`);
        viewSample.rows.forEach(row => {
          const columns = Object.keys(row);
          const userId = row.human_id || row.user_id || row.id;
          const userName = row.name || 'Unknown';
          const userRole = row.primary_role || row.role || 'No role';
          console.log(`   ${userId}: ${userName} (${userRole})`);
        });
      } catch (error) {
        console.log(`   ❌ Error querying view: ${error.message}`);
      }
      
    } else if (existingTables.includes('unified_user_roles')) {
      console.log('\n3. UNIFIED_USER_ROLES TABLE (User-Role Storage):');
      
      const unifiedStructure = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns 
        WHERE table_name = 'unified_user_roles' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      
      console.log('   📋 Structure:');
      unifiedStructure.rows.forEach(col => {
        console.log(`   ${col.column_name.padEnd(20)} ${col.data_type}`);
      });
      
      const unifiedSample = await client.query('SELECT * FROM unified_user_roles LIMIT 5');
      console.log(`\n   📊 Sample Data (${unifiedSample.rows.length} records):`);
      unifiedSample.rows.forEach(row => {
        const userId = row.human_id || row.user_id || row.id;
        const userName = row.name || 'Unknown';
        const userRole = row.primary_role || row.role || 'No role';
        console.log(`   ${userId}: ${userName} (${userRole})`);
      });
    }
    
    // APPUSERS CONTEXT
    console.log('\n4. APPUSERS TABLE (User Data):');
    try {
      const appUsersStructure = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns 
        WHERE table_name = 'appUsers' AND table_schema = 'public'
        AND column_name IN ('human_id', 'name', 'primary_role', 'email')
        ORDER BY ordinal_position
      `);
      
      const appUsersSample = await client.query(`
        SELECT human_id, name, primary_role, email 
        FROM "appUsers" 
        ORDER BY primary_role, name
      `);
      
      console.log(`   📊 Users with Roles (${appUsersSample.rows.length} users):`);
      appUsersSample.rows.forEach(user => {
        console.log(`   ${user.human_id}: ${user.name} (${user.primary_role})`);
      });
    } catch (error) {
      console.log(`   ❌ Error querying appUsers: ${error.message}`);
    }
    
    // KEY DIFFERENCES
    console.log('\n5. 🎯 KEY DIFFERENCES EXPLAINED:');
    
    console.log('\n   📋 ROLES TABLE:');
    console.log('   • Purpose: Define what roles exist in the system');
    console.log('   • Contains: Role metadata (name, description, permissions)');
    console.log('   • Type: Master reference table');
    console.log('   • Records: Static role definitions');
    console.log('   • Example: { name: "admin", description: "Administrator" }');
    
    console.log('\n   📋 UNIFIED_USER_ROLES:');
    if (existingViews.includes('unified_user_roles') || existingTables.includes('unified_user_roles')) {
      const type = existingViews.includes('unified_user_roles') ? 'View' : 'Table';
      console.log(`   • Purpose: Show users with their assigned roles`);
      console.log(`   • Contains: User data + role information combined`);
      console.log(`   • Type: ${type} (${type === 'View' ? 'computed from other tables' : 'stored data'})`);
      console.log(`   • Records: One per user with role details`);
      console.log(`   • Example: { human_id: "JKDP-ADM-001", name: "John", primary_role: "admin" }`);
    } else {
      console.log('   • Status: Does not exist');
      console.log('   • Purpose: Would combine user data with role information');
    }
    
    console.log('\n6. 🔄 RELATIONSHIP FLOW:');
    console.log('   roles (defines) → appUsers.primary_role → unified_user_roles (combines)');
    console.log('   │                 │                       │');
    console.log('   │                 │                       │');
    console.log('   "admin" exists    John has "admin"        John + admin details');
    
    console.log('\n7. 💡 PRACTICAL USE CASES:');
    console.log('\n   🔍 Query ROLES table when you need to:');
    console.log('   • List all available roles');
    console.log('   • Check role permissions');
    console.log('   • Manage role definitions');
    console.log('   • Validate if a role exists');
    
    console.log('\n   🔍 Query UNIFIED_USER_ROLES when you need to:');
    console.log('   • Get users with their role details');
    console.log('   • Display user lists with roles');
    console.log('   • Generate reports');
    console.log('   • Build dashboards');
    
    console.log('\n✅ SUMMARY:');
    console.log('   • ROLES = Role definitions (WHAT roles exist)');
    console.log('   • UNIFIED_USER_ROLES = User assignments (WHO has WHICH role)');
    console.log('   • Both work together for complete role management');
    
    client.release();
    
  } catch (error) {
    console.error('Error analyzing roles:', error);
  } finally {
    await pool.end();
  }
}

analyzeRolesFinal();
