const { Pool } = require('pg');
const fs = require('fs');

// Read Supabase configuration
const supabaseConfig = JSON.parse(fs.readFileSync('./supabase-service.json', 'utf8'));

const pool = new Pool({
    host: supabaseConfig.host,
    port: supabaseConfig.port,
    database: supabaseConfig.database,
    user: supabaseConfig.user,
    password: supabaseConfig.password,
});

async function verifyPrimaryRoleFK() {
    try {
        const client = await pool.connect();
        
        console.log('=== VERIFYING PRIMARY_ROLE FOREIGN KEY RELATIONSHIP ===\n');
        
        // Check the current structure
        console.log('1. Current appUsers.primary_role structure:');
        const columnInfo = await client.query(`
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns 
            WHERE table_name = 'appUsers' AND column_name = 'primary_role'
        `);
        
        if (columnInfo.rows.length > 0) {
            const col = columnInfo.rows[0];
            console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'NOT NULL'})`);
        }
        
        // Check foreign key constraints
        console.log('\n2. Foreign key constraints:');
        const constraints = await client.query(`
            SELECT 
                tc.constraint_name,
                tc.constraint_type,
                ccu.column_name,
                ccu.table_name as referenced_table,
                rc.update_rule,
                rc.delete_rule
            FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu 
                ON tc.constraint_name = ccu.constraint_name
            LEFT JOIN information_schema.referential_constraints rc
                ON tc.constraint_name = rc.constraint_name
            WHERE tc.table_name = 'appUsers' 
            AND tc.constraint_type = 'FOREIGN KEY'
            AND ccu.column_name = 'primary_role'
        `);
        
        if (constraints.rows.length > 0) {
            constraints.rows.forEach(constraint => {
                console.log(`   ✅ ${constraint.constraint_name}`);
                console.log(`      Type: ${constraint.constraint_type}`);
                console.log(`      References: ${constraint.referenced_table}.${constraint.column_name}`);
                console.log(`      On Update: ${constraint.update_rule || 'N/A'}`);
                console.log(`      On Delete: ${constraint.delete_rule || 'N/A'}`);
            });
        } else {
            console.log('   ❌ No foreign key constraints found!');
        }
        
        // Check indexes
        console.log('\n3. Indexes on primary_role:');
        const indexes = await client.query(`
            SELECT 
                indexname,
                indexdef
            FROM pg_indexes
            WHERE tablename = 'appUsers'
            AND indexdef ILIKE '%primary_role%'
        `);
        
        indexes.rows.forEach(index => {
            console.log(`   ✅ ${index.indexname}`);
        });
        
        // Test the relationship
        console.log('\n4. Testing the relationship:');
        const userRoles = await client.query(`
            SELECT 
                au.human_id,
                au.name,
                au.email,
                au.primary_role,
                r.name as role_name,
                r.description as role_description
            FROM "appUsers" au
            LEFT JOIN roles r ON au.primary_role = r.id
            ORDER BY r.name, au.name
        `);
        
        console.log(`   Found ${userRoles.rows.length} users:`);
        const roleGroups = {};
        userRoles.rows.forEach(user => {
            const roleName = user.role_name || 'No Role';
            if (!roleGroups[roleName]) roleGroups[roleName] = [];
            roleGroups[roleName].push(user);
        });
        
        Object.keys(roleGroups).forEach(roleName => {
            console.log(`     ${roleName}: ${roleGroups[roleName].length} users`);
            roleGroups[roleName].forEach(user => {
                console.log(`       - ${user.name} (${user.human_id})`);
            });
        });
        
        // Test referential integrity
        console.log('\n5. Testing referential integrity:');
        try {
            await client.query('BEGIN');
            
            // Try to insert a user with invalid role
            await client.query(`
                INSERT INTO "appUsers" (human_id, name, email, primary_role)
                VALUES ('TEST001', 'Test User', 'test@example.com', '00000000-0000-0000-0000-000000000000')
            `);
            
            await client.query('ROLLBACK');
            console.log('   ❌ Foreign key constraint is NOT working - invalid insert succeeded!');
            
        } catch (error) {
            await client.query('ROLLBACK');
            if (error.message.includes('violates foreign key constraint')) {
                console.log('   ✅ Foreign key constraint is working correctly');
            } else {
                console.log(`   ⚠️  Unexpected error: ${error.message}`);
            }
        }
        
        // Check if functions exist and work
        console.log('\n6. Testing helper functions:');
        
        try {
            const userWithRole = userRoles.rows.find(u => u.primary_role);
            if (userWithRole) {
                const functionResult = await client.query(`
                    SELECT * FROM get_user_primary_role($1)
                `, [userWithRole.primary_role.replace(/-/g, '').substring(0, 32)]);
                
                if (functionResult.rows.length > 0) {
                    console.log('   ✅ get_user_primary_role function works');
                } else {
                    console.log('   ⚠️  get_user_primary_role function returned no results');
                }
            }
        } catch (error) {
            console.log(`   ❌ get_user_primary_role function error: ${error.message}`);
        }
        
        try {
            const hierarchyResult = await client.query(`SELECT * FROM get_role_hierarchy()`);
            console.log(`   ✅ get_role_hierarchy function works (${hierarchyResult.rows.length} roles)`);
        } catch (error) {
            console.log(`   ❌ get_role_hierarchy function error: ${error.message}`);
        }
        
        // Check if view exists
        console.log('\n7. Checking views:');
        try {
            const viewResult = await client.query(`
                SELECT COUNT(*) as user_count FROM user_role_summary
            `);
            console.log(`   ✅ user_role_summary view works (${viewResult.rows[0].user_count} users)`);
        } catch (error) {
            console.log(`   ❌ user_role_summary view error: ${error.message}`);
        }
        
        console.log('\n✅ VERIFICATION COMPLETE!');
        
        if (constraints.rows.length > 0) {
            console.log('\n🚀 SUCCESS: Primary role foreign key relationship is properly configured!');
            console.log('\n📊 BENEFITS:');
            console.log('   • Data integrity enforced');
            console.log('   • Automatic cascade operations');
            console.log('   • Better query performance');
            console.log('   • Prevents orphaned references');
            console.log('   • Clean relational model');
        } else {
            console.log('\n❌ ISSUE: Foreign key constraint not found');
            console.log('   The primary_role column exists but lacks proper FK relationship');
        }
        
        client.release();
        
    } catch (error) {
        console.error('Error verifying primary_role FK:', error);
    } finally {
        await pool.end();
    }
}

verifyPrimaryRoleFK();
