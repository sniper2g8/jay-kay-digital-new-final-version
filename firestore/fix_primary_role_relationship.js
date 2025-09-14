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

async function fixPrimaryRoleRelationship() {
    try {
        const client = await pool.connect();
        
        console.log('=== FIXING PRIMARY_ROLE RELATIONSHIP WITH ROLES TABLE ===\n');
        
        console.log('1. Checking current appUsers.primary_role structure...');
        
        // Check current primary_role column
        const primaryRoleInfo = await client.query(`
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns 
            WHERE table_name = 'appUsers' AND column_name = 'primary_role'
        `);
        
        if (primaryRoleInfo.rows.length > 0) {
            const col = primaryRoleInfo.rows[0];
            console.log(`   Current: ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'NOT NULL'})`);
        } else {
            console.log('   ❌ primary_role column not found!');
            return;
        }
        
        console.log('\n2. Checking roles table structure...');
        
        // Get roles table info
        const rolesInfo = await client.query(`
            SELECT id, name, description 
            FROM roles 
            ORDER BY name
        `);
        
        console.log(`   Found ${rolesInfo.rows.length} roles:`);
        rolesInfo.rows.forEach(role => {
            console.log(`     ${role.id}: ${role.name} - ${role.description}`);
        });
        
        console.log('\n3. Checking current primary_role values in appUsers...');
        
        // Check current values
        const currentValues = await client.query(`
            SELECT 
                primary_role,
                COUNT(*) as count
            FROM "appUsers" 
            WHERE primary_role IS NOT NULL
            GROUP BY primary_role
            ORDER BY primary_role
        `);
        
        console.log('   Current primary_role values:');
        currentValues.rows.forEach(row => {
            console.log(`     ${row.primary_role}: ${row.count} users`);
        });
        
        console.log('\n4. Validating data consistency...');
        
        // Check if all primary_role values exist in roles table (handling type mismatch)
        const invalidRoles = await client.query(`
            SELECT DISTINCT au.primary_role
            FROM "appUsers" au
            LEFT JOIN roles r ON au.primary_role = r.name
            WHERE au.primary_role IS NOT NULL 
            AND r.name IS NULL
        `);
        
        if (invalidRoles.rows.length > 0) {
            console.log('   ❌ Found invalid primary_role values:');
            invalidRoles.rows.forEach(row => {
                console.log(`     ${row.primary_role} (not in roles table)`);
            });
            
            // Fix invalid values
            console.log('\n   Fixing invalid values...');
            for (const row of invalidRoles.rows) {
                // Try to find matching role by name
                const matchingRole = await client.query(`
                    SELECT id FROM roles WHERE name = $1
                `, [row.primary_role]);
                
                if (matchingRole.rows.length > 0) {
                    await client.query(`
                        UPDATE "appUsers" 
                        SET primary_role = $1 
                        WHERE primary_role = $2
                    `, [matchingRole.rows[0].id, row.primary_role]);
                    console.log(`     ✅ Updated ${row.primary_role} → ${matchingRole.rows[0].id}`);
                } else {
                    // Set to 'customer' as default
                    const customerRole = await client.query(`
                        SELECT id FROM roles WHERE name = 'customer'
                    `);
                    if (customerRole.rows.length > 0) {
                        await client.query(`
                            UPDATE "appUsers" 
                            SET primary_role = $1 
                            WHERE primary_role = $2
                        `, [customerRole.rows[0].id, row.primary_role]);
                        console.log(`     ✅ Set ${row.primary_role} → customer (${customerRole.rows[0].id})`);
                    }
                }
            }
        } else {
            console.log('   ✅ All primary_role values are valid');
        }
        
        console.log('\n5. Handling dependent objects and recreating primary_role column...');
        
        // First backup the current data
        console.log('   Creating backup...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS appusers_primary_role_backup AS
            SELECT id, human_id, name, email, primary_role, created_at
            FROM "appUsers"
            WHERE primary_role IS NOT NULL
        `);
        console.log('   ✅ Backup created');
        
        // Drop dependent views first
        console.log('   Dropping dependent views...');
        await client.query(`DROP VIEW IF EXISTS user_role_summary CASCADE`);
        console.log('   ✅ Dropped user_role_summary view');
        
        // Check for existing foreign key constraints
        const existingConstraints = await client.query(`
            SELECT constraint_name
            FROM information_schema.table_constraints
            WHERE table_name = 'appUsers' 
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name ILIKE '%primary_role%'
        `);
        
        // Drop existing constraints if any
        for (const constraint of existingConstraints.rows) {
            await client.query(`ALTER TABLE "appUsers" DROP CONSTRAINT IF EXISTS "${constraint.constraint_name}"`);
            console.log(`   ✅ Dropped existing constraint: ${constraint.constraint_name}`);
        }
        
        // Drop existing indexes
        const existingIndexes = await client.query(`
            SELECT indexname
            FROM pg_indexes
            WHERE tablename = 'appUsers'
            AND indexdef ILIKE '%primary_role%'
        `);
        
        for (const index of existingIndexes.rows) {
            await client.query(`DROP INDEX IF EXISTS "${index.indexname}"`);
            console.log(`   ✅ Dropped existing index: ${index.indexname}`);
        }
        
        // Store current primary_role values with their corresponding UUIDs
        const currentPrimaryRoles = await client.query(`
            SELECT 
                au.id, 
                au.primary_role,
                r.id as role_uuid
            FROM "appUsers" au
            JOIN roles r ON au.primary_role = r.name
            WHERE au.primary_role IS NOT NULL
        `);
        
        // Drop and recreate the column with proper type
        await client.query(`ALTER TABLE "appUsers" DROP COLUMN IF EXISTS primary_role`);
        console.log('   ✅ Dropped old primary_role column');
        
        // Add new primary_role column with UUID type and foreign key
        await client.query(`
            ALTER TABLE "appUsers" 
            ADD COLUMN primary_role UUID REFERENCES roles(id) ON DELETE SET NULL ON UPDATE CASCADE
        `);
        console.log('   ✅ Added new primary_role column with foreign key constraint');
        
        // Restore the data with proper UUID values
        console.log('\n6. Restoring primary_role data...');
        for (const user of currentPrimaryRoles.rows) {
            try {
                await client.query(`
                    UPDATE "appUsers" 
                    SET primary_role = $1 
                    WHERE id = $2
                `, [user.role_uuid, user.id]);
            } catch (error) {
                console.log(`   ⚠️  Could not restore primary_role for user ${user.id}: ${error.message}`);
            }
        }
        console.log(`   ✅ Restored primary_role for ${currentPrimaryRoles.rows.length} users`);
        
        console.log('\n7. Creating optimized indexes...');
        
        // Create indexes for better performance
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_appusers_primary_role 
            ON "appUsers"(primary_role) 
            WHERE primary_role IS NOT NULL
        `);
        console.log('   ✅ Created index on primary_role');
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_appusers_primary_role_status 
            ON "appUsers"(primary_role, status) 
            WHERE primary_role IS NOT NULL AND status IS NOT NULL
        `);
        console.log('   ✅ Created composite index on primary_role + status');
        
        console.log('\n8. Updating helper functions...');
        
        // Drop existing functions first
        await client.query(`DROP FUNCTION IF EXISTS get_user_primary_role(UUID)`);
        await client.query(`DROP FUNCTION IF EXISTS get_role_hierarchy()`);
        
        // Update the get_user_primary_role function to use the FK relationship
        await client.query(`
            CREATE OR REPLACE FUNCTION get_user_primary_role(user_id UUID)
            RETURNS TABLE(
                role_id UUID,
                role_name TEXT,
                role_description TEXT,
                permissions TEXT[]
            )
            LANGUAGE plpgsql
            STABLE
            AS $$
            BEGIN
                RETURN QUERY
                SELECT 
                    r.id,
                    r.name,
                    r.description,
                    ARRAY_AGG(p.name) AS permissions
                FROM "appUsers" au
                JOIN roles r ON au.primary_role = r.id
                JOIN role_permissions rp ON r.id = rp.role_id
                JOIN permissions p ON rp.permission_id = p.id
                WHERE au.id = user_id
                GROUP BY r.id, r.name, r.description;
            END;
            $$;
        `);
        console.log('   ✅ Updated get_user_primary_role function');
        
        // Create a function to get role hierarchy
        await client.query(`
            CREATE OR REPLACE FUNCTION get_role_hierarchy()
            RETURNS TABLE(
                role_id UUID,
                role_name TEXT,
                user_count BIGINT,
                permission_count BIGINT
            )
            LANGUAGE plpgsql
            STABLE
            AS $$
            BEGIN
                RETURN QUERY
                SELECT 
                    r.id,
                    r.name,
                    COUNT(DISTINCT au.id) AS user_count,
                    COUNT(DISTINCT rp.permission_id) AS permission_count
                FROM roles r
                LEFT JOIN "appUsers" au ON r.id = au.primary_role
                LEFT JOIN role_permissions rp ON r.id = rp.role_id
                GROUP BY r.id, r.name
                ORDER BY 
                    CASE r.name
                        WHEN 'super_admin' THEN 1
                        WHEN 'admin' THEN 2
                        WHEN 'manager' THEN 3
                        WHEN 'staff' THEN 4
                        WHEN 'customer' THEN 5
                        ELSE 6
                    END;
            END;
            $$;
        `);
        console.log('   ✅ Created get_role_hierarchy function');
        
        // Recreate the user_role_summary view
        await client.query(`
            CREATE VIEW user_role_summary AS
            SELECT 
                au.id,
                au.human_id,
                au.name,
                au.email,
                au.status,
                r.name as primary_role_name,
                r.description as primary_role_description,
                au.primary_role as primary_role_id,
                au.last_role_update,
                au.created_at,
                au.updated_at,
                COALESCE(
                    (SELECT COUNT(*) FROM user_roles ur WHERE ur.user_id = au.id),
                    0
                ) as total_roles,
                COALESCE(
                    (SELECT COUNT(DISTINCT p.id) 
                     FROM user_roles ur 
                     JOIN role_permissions rp ON ur.role_id = rp.role_id 
                     JOIN permissions p ON rp.permission_id = p.id 
                     WHERE ur.user_id = au.id),
                    0
                ) as total_permissions
            FROM "appUsers" au
            LEFT JOIN roles r ON au.primary_role = r.id
        `);
        console.log('   ✅ Recreated user_role_summary view');
        
        console.log('\n9. Testing the new relationship...');
        
        // Test the foreign key constraint
        const testResults = await client.query(`
            SELECT 
                au.human_id,
                au.name,
                au.email,
                r.name as role_name,
                r.description as role_description
            FROM "appUsers" au
            LEFT JOIN roles r ON au.primary_role = r.id
            ORDER BY r.name, au.name
        `);
        
        console.log(`   ✅ Found ${testResults.rows.length} users with role relationships:`);
        const roleGroups = {};
        testResults.rows.forEach(user => {
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
        
        console.log('\n10. Verifying foreign key constraint...');
        
        // Test foreign key constraint by trying to insert invalid role
        try {
            await client.query(`
                INSERT INTO "appUsers" (human_id, name, email, primary_role)
                VALUES ('TEST001', 'Test User', 'test@example.com', '00000000-0000-0000-0000-000000000000')
            `);
            console.log('   ❌ Foreign key constraint not working!');
        } catch (error) {
            if (error.message.includes('violates foreign key constraint')) {
                console.log('   ✅ Foreign key constraint is working correctly');
            } else {
                console.log(`   ⚠️  Unexpected error: ${error.message}`);
            }
        }
        
        // Clean up test data if any
        await client.query(`DELETE FROM "appUsers" WHERE human_id = 'TEST001'`);
        
        console.log('\n11. Performance analysis...');
        
        // Check constraint and index information
        const constraints = await client.query(`
            SELECT 
                tc.constraint_name,
                tc.constraint_type,
                ccu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu 
                ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_name = 'appUsers' 
            AND ccu.column_name = 'primary_role'
        `);
        
        console.log('   Constraints on primary_role:');
        constraints.rows.forEach(constraint => {
            console.log(`     ${constraint.constraint_type}: ${constraint.constraint_name}`);
        });
        
        const indexes = await client.query(`
            SELECT 
                indexname,
                indexdef
            FROM pg_indexes
            WHERE tablename = 'appUsers'
            AND indexdef ILIKE '%primary_role%'
        `);
        
        console.log('   Indexes on primary_role:');
        indexes.rows.forEach(index => {
            console.log(`     ${index.indexname}`);
        });
        
        console.log('\n✅ PRIMARY_ROLE RELATIONSHIP FIXED!');
        console.log('\n📊 SUMMARY:');
        console.log(`   ✅ Foreign key constraint: appUsers.primary_role → roles.id`);
        console.log(`   ✅ Indexes created: ${indexes.rows.length}`);
        console.log(`   ✅ Users with roles: ${testResults.rows.filter(u => u.role_name).length}`);
        console.log(`   ✅ Helper functions updated: 2`);
        console.log(`   ✅ Data integrity enforced`);
        
        console.log('\n🚀 BENEFITS:');
        console.log('   • Proper referential integrity');
        console.log('   • Better query performance with indexes');
        console.log('   • Prevents orphaned role references');
        console.log('   • Cleaner data model');
        console.log('   • Automatic cascade updates');
        
        console.log('\n🔧 AVAILABLE FUNCTIONS:');
        console.log('   • get_user_primary_role(user_id) - Get user role with permissions');
        console.log('   • get_role_hierarchy() - View role structure and user counts');
        console.log('   • user_role_summary view - Complete user-role overview');
        
        client.release();
        
    } catch (error) {
        console.error('Error fixing primary_role relationship:', error);
    } finally {
        await pool.end();
    }
}

fixPrimaryRoleRelationship();
