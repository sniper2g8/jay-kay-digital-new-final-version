const { Pool } = require('pg');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./supabase-service.json', 'utf8'));
const pool = new Pool(config);

async function analyzeRolesDifference() {
  try {
    const client = await pool.connect();
    
    console.log('=== ROLES vs UNIFIED_USER_ROLES ANALYSIS ===\n');
    
    // Check if unified_user_roles exists as table or view
    const unifiedExists = await client.query(`
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'unified_user_roles'
    `);
    
    const unifiedViewExists = await client.query(`
      SELECT 
        table_name,
        table_type
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name = 'unified_user_roles'
    `);
    
    console.log('1. EXISTENCE CHECK:');
    console.log(`   📋 roles table: EXISTS (confirmed)`);
    console.log(`   📋 unified_user_roles table: ${unifiedExists.rows.length > 0 ? 'EXISTS' : 'NOT FOUND'}`);
    console.log(`   👁️ unified_user_roles view: ${unifiedViewExists.rows.length > 0 ? 'EXISTS' : 'NOT FOUND'}`);
    
    // Check roles table structure
    console.log('\n2. ROLES TABLE STRUCTURE:');
    const rolesStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'roles' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    rolesStructure.rows.forEach(col => {
      console.log(`   ${col.column_name.padEnd(20)} ${col.data_type.padEnd(15)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check roles data
    console.log('\n3. ROLES TABLE DATA:');
    const rolesData = await client.query('SELECT * FROM roles ORDER BY level');
    console.log(`   📊 Total roles: ${rolesData.rows.length}`);
    rolesData.rows.forEach(role => {
      console.log(`   ${role.level}: ${role.name.padEnd(15)} - ${role.description}`);
    });
    
    // Check if unified_user_roles view exists and get its definition
    if (unifiedViewExists.rows.length > 0) {
      console.log('\n4. UNIFIED_USER_ROLES VIEW:');
      
      const viewDefinition = await client.query(`
        SELECT definition
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND viewname = 'unified_user_roles'
      `);
      
      console.log('   📋 View Definition:');
      console.log(`   ${viewDefinition.rows[0]?.definition || 'Definition not found'}`);
      
      // Sample data from view
      try {
        const viewData = await client.query('SELECT * FROM unified_user_roles LIMIT 5');
        console.log(`\n   📊 Sample data (${viewData.rows.length} records):`);
        viewData.rows.forEach(row => {
          console.log(`   ${row.human_id || row.user_id}: ${row.name} (${row.primary_role || row.role})`);
        });
      } catch (error) {
        console.log(`   ❌ Error querying view: ${error.message}`);
      }
      
    } else if (unifiedExists.rows.length > 0) {
      console.log('\n4. UNIFIED_USER_ROLES TABLE:');
      
      const unifiedStructure = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'unified_user_roles' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      
      console.log('   📋 Table Structure:');
      unifiedStructure.rows.forEach(col => {
        console.log(`   ${col.column_name.padEnd(20)} ${col.data_type.padEnd(15)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
      
      const unifiedData = await client.query('SELECT * FROM unified_user_roles LIMIT 5');
      console.log(`\n   📊 Sample data (${unifiedData.rows.length} records):`);
      unifiedData.rows.forEach(row => {
        console.log(`   ${row.human_id || row.user_id}: ${row.name} (${row.primary_role || row.role})`);
      });
    }
    
    // Check related tables
    console.log('\n5. RELATED ROLE TABLES:');
    
    const relatedTables = ['user_roles', 'role_permissions', 'appUsers'];
    
    for (const table of relatedTables) {
      try {
        const count = await client.query(`SELECT COUNT(*) as count FROM "${table}"`);
        console.log(`   📋 ${table}: ${count.rows[0].count} records`);
        
        if (table === 'user_roles') {
          const sample = await client.query(`SELECT * FROM "${table}" LIMIT 3`);
          sample.rows.forEach(row => {
            console.log(`     User: ${row.user_id} → Role: ${row.role_id}`);
          });
        }
        
        if (table === 'appUsers') {
          const sample = await client.query(`SELECT human_id, name, primary_role FROM "${table}" LIMIT 3`);
          sample.rows.forEach(row => {
            console.log(`     ${row.human_id}: ${row.name} (${row.primary_role})`);
          });
        }
        
      } catch (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
      }
    }
    
    console.log('\n6. KEY DIFFERENCES ANALYSIS:');
    console.log('\n   🎯 ROLES TABLE:');
    console.log('   • Purpose: Master reference table for role definitions');
    console.log('   • Contains: Role names, descriptions, hierarchy levels');
    console.log('   • Type: Static lookup table');
    console.log('   • Usage: Define what roles exist in the system');
    
    console.log('\n   🎯 UNIFIED_USER_ROLES:');
    if (unifiedViewExists.rows.length > 0) {
      console.log('   • Purpose: View combining user data with their roles');
      console.log('   • Contains: User info + role assignments');
      console.log('   • Type: Dynamic view');
      console.log('   • Usage: Query users with their assigned roles');
    } else if (unifiedExists.rows.length > 0) {
      console.log('   • Purpose: Table combining user data with their roles');
      console.log('   • Contains: User info + role assignments');
      console.log('   • Type: Data table');
      console.log('   • Usage: Store users with their assigned roles');
    } else {
      console.log('   • Status: Does not exist in current database');
      console.log('   • Recommendation: Create as view for user-role queries');
    }
    
    console.log('\n7. RELATIONSHIP SUMMARY:');
    console.log('   📊 roles → Defines available roles (super_admin, admin, etc.)');
    console.log('   📊 appUsers.primary_role → References roles.name');
    console.log('   📊 user_roles → Many-to-many user-role assignments');
    console.log('   📊 unified_user_roles → Query helper combining user + role data');
    
    console.log('\n💡 RECOMMENDATION:');
    if (unifiedViewExists.rows.length === 0 && unifiedExists.rows.length === 0) {
      console.log('   Create unified_user_roles VIEW for easier querying:');
      console.log('   CREATE VIEW unified_user_roles AS');
      console.log('   SELECT au.*, r.description as role_description, r.level as role_level');
      console.log('   FROM "appUsers" au');
      console.log('   LEFT JOIN roles r ON au.primary_role = r.name;');
    } else {
      console.log('   ✅ unified_user_roles exists and provides user-role integration');
    }
    
    client.release();
    
  } catch (error) {
    console.error('Error analyzing roles:', error);
  } finally {
    await pool.end();
  }
}

analyzeRolesDifference();
