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

async function convertPrimaryRoleToName() {
    try {
        const client = await pool.connect();
        
        console.log('=== CONVERTING PRIMARY_ROLE FROM UUID TO ROLE NAME ===\n');
        
        console.log('1. Checking current primary_role values...');
        
        // Get current primary_role values with their names
        const currentRoles = await client.query(`
            SELECT 
                au.id,
                au.human_id,
                au.name,
                au.primary_role as role_uuid,
                r.name as role_name
            FROM "appUsers" au
            LEFT JOIN roles r ON au.primary_role = r.id
            WHERE au.primary_role IS NOT NULL
            ORDER BY r.name, au.name
        `);
        
        console.log(`   Found ${currentRoles.rows.length} users with roles:`);
        const roleGroups = {};
        currentRoles.rows.forEach(user => {
            const roleName = user.role_name || 'Unknown';
            if (!roleGroups[roleName]) roleGroups[roleName] = [];
            roleGroups[roleName].push(user);
        });
        
        Object.keys(roleGroups).forEach(roleName => {
            console.log(`     ${roleName}: ${roleGroups[roleName].length} users`);
            roleGroups[roleName].forEach(user => {
                console.log(`       - ${user.name} (${user.human_id})`);
            });
        });
        
        console.log('\n2. Creating backup of current data...');
        
        // Create backup table
        await client.query(`
            CREATE TABLE IF NOT EXISTS appusers_primary_role_uuid_backup AS
            SELECT 
                id, 
                human_id, 
                name, 
                email, 
                primary_role as role_uuid,
                created_at
            FROM "appUsers"
            WHERE primary_role IS NOT NULL
        `);
        console.log('   ✅ Backup created: appusers_primary_role_uuid_backup');
        
        console.log('\n3. Dropping dependent objects...');
        
        // Drop dependent objects
        await client.query(`DROP VIEW IF EXISTS user_role_summary CASCADE`);
        console.log('   ✅ Dropped user_role_summary view');
        
        await client.query(`DROP FUNCTION IF EXISTS get_user_primary_role(UUID)`);
        await client.query(`DROP FUNCTION IF EXISTS get_role_hierarchy()`);
        console.log('   ✅ Dropped dependent functions');
        
        console.log('\n4. Dropping existing foreign key constraint...');
        
        // Drop existing foreign key constraint
        await client.query(`
            ALTER TABLE "appUsers" 
            DROP CONSTRAINT IF EXISTS fk_appusers_primary_role
        `);
        console.log('   ✅ Dropped foreign key constraint');
        
        console.log('\n5. Converting primary_role column to role name...');
        
        // Add a temporary column for role names
        await client.query(`
            ALTER TABLE "appUsers" 
            ADD COLUMN primary_role_name VARCHAR(50)
        `);
        console.log('   ✅ Added temporary primary_role_name column');
        
        // Update the temporary column with role names
        await client.query(`
            UPDATE "appUsers" 
            SET primary_role_name = r.name
            FROM roles r
            WHERE "appUsers".primary_role = r.id
        `);
        console.log('   ✅ Populated primary_role_name with role names');
        
        // Drop the old UUID column
        await client.query(`
            ALTER TABLE "appUsers" 
            DROP COLUMN primary_role
        `);
        console.log('   ✅ Dropped old primary_role UUID column');
        
        // Rename the temporary column
        await client.query(`
            ALTER TABLE "appUsers" 
            RENAME COLUMN primary_role_name TO primary_role
        `);
        console.log('   ✅ Renamed primary_role_name to primary_role');
        
        console.log('\n6. Adding foreign key constraint to roles.name...');
        
        // Add foreign key constraint referencing roles.name
        await client.query(`
            ALTER TABLE "appUsers" 
            ADD CONSTRAINT fk_appusers_primary_role_name 
            FOREIGN KEY (primary_role) 
            REFERENCES roles(name) 
            ON DELETE SET NULL 
            ON UPDATE CASCADE
        `);
        console.log('   ✅ Added foreign key constraint: appUsers.primary_role → roles.name');
        
        console.log('\n7. Creating optimized indexes...');
        
        // Create indexes
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_appusers_primary_role_name 
            ON "appUsers"(primary_role) 
            WHERE primary_role IS NOT NULL
        `);
        console.log('   ✅ Created index on primary_role (name)');
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_appusers_primary_role_status 
            ON "appUsers"(primary_role, status) 
            WHERE primary_role IS NOT NULL AND status IS NOT NULL
        `);
        console.log('   ✅ Created composite index on primary_role + status');
        
        console.log('\n8. Creating updated helper functions...');
        
        // Create get_user_primary_role function using role name
        await client.query(`
            CREATE OR REPLACE FUNCTION get_user_primary_role(user_id UUID)
            RETURNS TABLE(
                role_id UUID,
                role_name VARCHAR(50),
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
                JOIN roles r ON au.primary_role = r.name
                JOIN role_permissions rp ON r.id = rp.role_id
                JOIN permissions p ON rp.permission_id = p.id
                WHERE au.id = user_id
                GROUP BY r.id, r.name, r.description;
            END;
            $$;
        `);
        console.log('   ✅ Created get_user_primary_role function');
        
        // Create get_role_hierarchy function
        await client.query(`
            CREATE OR REPLACE FUNCTION get_role_hierarchy()
            RETURNS TABLE(
                role_id UUID,
                role_name VARCHAR(50),
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
                LEFT JOIN "appUsers" au ON r.name = au.primary_role
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
        
        // Create get_user_permissions function for easy permission checking
        await client.query(`
            CREATE OR REPLACE FUNCTION get_user_permissions(user_id UUID)
            RETURNS TEXT[]
            LANGUAGE plpgsql
            STABLE
            AS $$
            DECLARE
                user_permissions TEXT[];
            BEGIN
                -- Get permissions from primary role
                SELECT ARRAY_AGG(DISTINCT p.name)
                INTO user_permissions
                FROM "appUsers" au
                JOIN roles r ON au.primary_role = r.name
                JOIN role_permissions rp ON r.id = rp.role_id
                JOIN permissions p ON rp.permission_id = p.id
                WHERE au.id = user_id;
                
                -- Add permissions from additional roles in user_roles table
                SELECT ARRAY_AGG(DISTINCT p.name) || COALESCE(user_permissions, ARRAY[]::TEXT[])
                INTO user_permissions
                FROM user_roles ur
                JOIN role_permissions rp ON ur.role_id = rp.role_id
                JOIN permissions p ON rp.permission_id = p.id
                WHERE ur.user_id = user_id;
                
                RETURN COALESCE(user_permissions, ARRAY[]::TEXT[]);
            END;
            $$;
        `);
        console.log('   ✅ Created get_user_permissions function');
        
        console.log('\n9. Recreating user_role_summary view...');
        
        // Create updated user_role_summary view
        await client.query(`
            CREATE VIEW user_role_summary AS
            SELECT 
                au.id,
                au.human_id,
                au.name,
                au.email,
                au.status,
                au.primary_role as primary_role_name,
                r.description as primary_role_description,
                r.id as primary_role_id,
                au.last_role_update,
                au.created_at,
                au.updated_at,
                COALESCE(
                    (SELECT COUNT(*) FROM user_roles ur WHERE ur.user_id = au.id),
                    0
                ) as total_roles,
                COALESCE(array_length(get_user_permissions(au.id), 1), 0) as total_permissions
            FROM "appUsers" au
            LEFT JOIN roles r ON au.primary_role = r.name
        `);
        console.log('   ✅ Created updated user_role_summary view');
        
        console.log('\n10. Testing the new setup...');
        
        // Test foreign key constraint
        try {
            await client.query('BEGIN');
            
            await client.query(`
                INSERT INTO "appUsers" (human_id, name, email, primary_role)
                VALUES ('TEST001', 'Test User', 'test@example.com', 'invalid_role')
            `);
            
            await client.query('ROLLBACK');
            console.log('   ❌ Foreign key constraint is NOT working');
            
        } catch (error) {
            await client.query('ROLLBACK');
            if (error.message.includes('violates foreign key constraint')) {
                console.log('   ✅ Foreign key constraint is working correctly');
            } else {
                console.log(`   ⚠️  Other error: ${error.message.substring(0, 80)}...`);
            }
        }
        
        // Test the updated structure
        const finalRoles = await client.query(`
            SELECT 
                au.human_id,
                au.name,
                au.primary_role,
                array_length(get_user_permissions(au.id), 1) as permission_count
            FROM "appUsers" au
            WHERE au.primary_role IS NOT NULL
            ORDER BY au.primary_role, au.name
        `);
        
        console.log(`\n   ✅ Updated user roles (${finalRoles.rows.length} users):`);
        const finalGroups = {};
        finalRoles.rows.forEach(user => {
            const roleName = user.primary_role || 'No Role';
            if (!finalGroups[roleName]) finalGroups[roleName] = [];
            finalGroups[roleName].push(user);
        });
        
        Object.keys(finalGroups).forEach(roleName => {
            console.log(`     ${roleName}: ${finalGroups[roleName].length} users`);
            finalGroups[roleName].forEach(user => {
                console.log(`       - ${user.name} (${user.human_id}) - ${user.permission_count} permissions`);
            });
        });
        
        // Test view
        const viewTest = await client.query(`
            SELECT primary_role_name, COUNT(*) as count
            FROM user_role_summary 
            WHERE primary_role_name IS NOT NULL
            GROUP BY primary_role_name
            ORDER BY primary_role_name
        `);
        
        console.log(`\n   ✅ View test (${viewTest.rows.length} role groups):`);
        viewTest.rows.forEach(group => {
            console.log(`     ${group.primary_role_name}: ${group.count} users`);
        });
        
        console.log('\n✅ PRIMARY_ROLE CONVERTED TO ROLE NAME SUCCESSFULLY!');
        console.log('\n📊 SUMMARY:');
        console.log('   ✅ Column Type: VARCHAR(50) (role name)');
        console.log('   ✅ Foreign Key: appUsers.primary_role → roles.name');
        console.log('   ✅ Cascade Rules: UPDATE CASCADE, DELETE SET NULL');
        console.log('   ✅ Data Integrity: Enforced');
        console.log('   ✅ Indexes: Optimized');
        console.log('   ✅ Helper Functions: Updated');
        console.log('   ✅ Views: Available');
        console.log('   ✅ Backup: appusers_primary_role_uuid_backup');
        
        console.log('\n🚀 BENEFITS:');
        console.log('   • Much more intuitive to work with role names');
        console.log('   • Easier queries without joins');
        console.log('   • Better readability in database');
        console.log('   • Simpler frontend implementation');
        console.log('   • Still maintains referential integrity');
        console.log('   • Direct role name comparisons possible');
        
        console.log('\n💡 USAGE EXAMPLES:');
        console.log("   SELECT * FROM appUsers WHERE primary_role = 'admin'");
        console.log("   SELECT * FROM user_role_summary WHERE primary_role_name = 'customer'");
        console.log("   SELECT get_user_permissions('user-uuid-here')");
        
        client.release();
        
    } catch (error) {
        console.error('Error converting primary_role to name:', error);
    } finally {
        await pool.end();
    }
}

convertPrimaryRoleToName();
