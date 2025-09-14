const { Pool } = require('pg');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./supabase-service.json', 'utf8'));
const pool = new Pool(config);

async function analyzeRolesSimple() {
  try {
    const client = await pool.connect();
    
    console.log('=== ROLES vs UNIFIED_USER_ROLES DIFFERENCES ===\n');
    
    // Check what exists
    console.log('1. CHECKING WHAT EXISTS:');
    
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
    
    console.log(`   📋 roles table: ${existingTables.includes('roles') ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    console.log(`   📋 unified_user_roles table: ${existingTables.includes('unified_user_roles') ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    console.log(`   👁️ unified_user_roles view: ${existingViews.includes('unified_user_roles') ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    
    // Analyze roles table
    if (existingTables.includes('roles')) {
      console.log('\n2. ROLES TABLE ANALYSIS:');
      
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
      
      const rolesData = await client.query('SELECT * FROM roles ORDER BY level');
      console.log(`\n   📊 Data (${rolesData.rows.length} roles):`);
      rolesData.rows.forEach(role => {
        console.log(`   Level ${role.level}: ${role.name.padEnd(15)} - ${role.description}`);
      });
    }
    
    // Analyze unified_user_roles if it exists
    if (existingViews.includes('unified_user_roles')) {
      console.log('\n3. UNIFIED_USER_ROLES VIEW ANALYSIS:');
      
      const viewDefinition = await client.query(`
        SELECT definition
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND viewname = 'unified_user_roles'
      `);
      
      console.log('   📋 View Definition:');
      console.log(`   ${viewDefinition.rows[0]?.definition}`);
      
      try {
        const viewData = await client.query('SELECT * FROM unified_user_roles LIMIT 5');
        console.log(`\n   📊 Sample Data (${viewData.rows.length} records):`);
        viewData.rows.forEach(row => {
          console.log(`   ${row.human_id}: ${row.name} (${row.primary_role})`);
        });
      } catch (error) {
        console.log(`   ❌ Error querying view: ${error.message}`);
      }
      
    } else if (existingTables.includes('unified_user_roles')) {
      console.log('\n3. UNIFIED_USER_ROLES TABLE ANALYSIS:');
      
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
      
      const unifiedData = await client.query('SELECT * FROM unified_user_roles LIMIT 5');
      console.log(`\n   📊 Sample Data (${unifiedData.rows.length} records):`);
      unifiedData.rows.forEach(row => {
        console.log(`   ${row.human_id || row.user_id}: ${row.name} (${row.primary_role || row.role})`);
      });
    }
    
    // Check appUsers for context
    console.log('\n4. APPUSERS CONTEXT:');
    try {
      const appUsersRoles = await client.query(`
        SELECT human_id, name, primary_role 
        FROM "appUsers" 
        ORDER BY primary_role, name
      `);
      
      console.log(`   📊 Users by Role (${appUsersRoles.rows.length} users):`);
      appUsersRoles.rows.forEach(user => {
        console.log(`   ${user.human_id}: ${user.name} (${user.primary_role})`);
      });
    } catch (error) {
      console.log(`   ❌ Error querying appUsers: ${error.message}`);
    }
    
    console.log('\n5. KEY DIFFERENCES EXPLAINED:');
    console.log('\n   🎯 ROLES TABLE:');
    console.log('   • Purpose: Master reference for role definitions');
    console.log('   • Contains: Role metadata (name, description, level)');
    console.log('   • Type: Static lookup table');
    console.log('   • Records: 5 roles (super_admin, admin, manager, staff, customer)');
    console.log('   • Usage: Define what roles exist and their hierarchy');
    
    console.log('\n   🎯 UNIFIED_USER_ROLES:');
    if (existingViews.includes('unified_user_roles') || existingTables.includes('unified_user_roles')) {
      console.log('   • Purpose: Combines user data with their role information');
      console.log('   • Contains: User details + role assignments');
      console.log('   • Type: ' + (existingViews.includes('unified_user_roles') ? 'Dynamic view' : 'Data table'));
      console.log('   • Records: One per user with their role info');
      console.log('   • Usage: Query users with their role details in one go');
    } else {
      console.log('   • Status: DOES NOT EXIST');
      console.log('   • Would contain: User details + role assignments');
      console.log('   • Recommended type: View');
      console.log('   • Usage: Simplify user-role queries');
    }
    
    console.log('\n6. RELATIONSHIP DIAGRAM:');
    console.log('   roles (master) ──→ appUsers.primary_role ──→ unified_user_roles (view)');
    console.log('   │                                          │');
    console.log('   │ (defines)                                │ (combines)');
    console.log('   │                                          │');
    console.log('   └── role definitions                       └── user + role data');
    
    console.log('\n7. PRACTICAL DIFFERENCES:');
    console.log('\n   📋 Query roles.name = "admin"');
    console.log('   → Returns: { name: "admin", description: "Administrator", level: 2 }');
    console.log('\n   📋 Query unified_user_roles WHERE primary_role = "admin"');
    console.log('   → Returns: { human_id: "JKDP-ADM-001", name: "John Doe", email: "...", primary_role: "admin", role_description: "Administrator" }');
    
    console.log('\n💡 SUMMARY:');
    console.log('   • roles = WHAT roles exist (definitions)');
    console.log('   • unified_user_roles = WHO has WHICH roles (assignments)');
    console.log('   • Use roles for role management');
    console.log('   • Use unified_user_roles for user queries');
    
    client.release();
    
  } catch (error) {
    console.error('Error analyzing roles:', error);
  } finally {
    await pool.end();
  }
}

analyzeRolesSimple();
