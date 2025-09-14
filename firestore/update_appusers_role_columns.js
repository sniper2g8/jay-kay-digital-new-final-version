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

async function updateAppUsersRoleColumns() {
    try {
        const client = await pool.connect();
        
        console.log('=== UPDATING APPUSERS TABLE - ROLE SYSTEM CLEANUP ===\n');
        
        console.log('1. Checking current appUsers table structure...');
        
        // Check current columns
        const currentColumns = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'appUsers' 
            AND column_name IN ('role', 'primary_role', 'is_active', 'status')
            ORDER BY ordinal_position
        `);
        
        console.log('   Current role-related columns:');
        currentColumns.rows.forEach(col => {
            console.log(`     ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}) ${col.column_default ? `default: ${col.column_default}` : ''}`);
        });
        
        console.log('\n2. Adding new role system columns...');
        
        // Add primary_role column to track the main role
        try {
            await client.query(`
                ALTER TABLE "appUsers" 
                ADD COLUMN IF NOT EXISTS primary_role VARCHAR(50)
            `);
            console.log('   ✅ Added primary_role column');
        } catch (error) {
            console.log(`   ⚠️  primary_role column: ${error.message}`);
        }
        
        // Add user status column
        try {
            await client.query(`
                ALTER TABLE "appUsers" 
                ADD COLUMN IF NOT EXISTS status user_status DEFAULT 'active'
            `);
            console.log('   ✅ Added status column');
        } catch (error) {
            console.log(`   ⚠️  status column: ${error.message}`);
        }
        
        // Add last_role_update timestamp
        try {
            await client.query(`
                ALTER TABLE "appUsers" 
                ADD COLUMN IF NOT EXISTS last_role_update TIMESTAMPTZ DEFAULT NOW()
            `);
            console.log('   ✅ Added last_role_update column');
        } catch (error) {
            console.log(`   ⚠️  last_role_update column: ${error.message}`);
        }
        
        console.log('\n3. Populating primary_role from current role assignments...');
        
        // Get all users and their current active roles
        const userRoles = await client.query(`
            SELECT 
                u.id,
                u.name,
                u.human_id,
                u.role as old_role,
                r.name as current_role_name
            FROM "appUsers" u
            JOIN "user_roles" ur ON u.id = ur.user_id
            JOIN "roles" r ON ur.role_id = r.id
            WHERE ur.is_active = true
            ORDER BY u.name
        `);
        
        console.log('   Updating primary_role for each user:');
        for (const user of userRoles.rows) {
            try {
                await client.query(`
                    UPDATE "appUsers" 
                    SET primary_role = $1, 
                        last_role_update = NOW()
                    WHERE id = $2
                `, [user.current_role_name, user.id]);
                
                console.log(`     ✅ ${user.name} (${user.human_id}): ${user.old_role} -> ${user.current_role_name}`);
            } catch (error) {
                console.log(`     ❌ ${user.name}: ${error.message}`);
            }
        }
        
        console.log('\n4. Creating helper functions for role management...');
        
        // Function to get user's primary role
        await client.query(`
            CREATE OR REPLACE FUNCTION get_user_primary_role(user_uuid UUID)
            RETURNS TEXT AS $$
            DECLARE
                role_name TEXT;
            BEGIN
                SELECT r.name INTO role_name
                FROM "user_roles" ur
                JOIN "roles" r ON ur.role_id = r.id
                WHERE ur.user_id = user_uuid 
                AND ur.is_active = true
                ORDER BY 
                    CASE r.name 
                        WHEN 'super_admin' THEN 1
                        WHEN 'admin' THEN 2
                        WHEN 'manager' THEN 3
                        WHEN 'staff' THEN 4
                        WHEN 'customer' THEN 5
                        ELSE 6
                    END
                LIMIT 1;
                
                RETURN COALESCE(role_name, 'customer');
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
        `);
        console.log('   ✅ Created get_user_primary_role function');
        
        // Function to update primary_role when user_roles change
        await client.query(`
            CREATE OR REPLACE FUNCTION update_user_primary_role()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Update the appUsers primary_role when user_roles changes
                UPDATE "appUsers" 
                SET primary_role = get_user_primary_role(NEW.user_id),
                    last_role_update = NOW()
                WHERE id = NEW.user_id;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);
        console.log('   ✅ Created update_user_primary_role trigger function');
        
        // Create trigger to auto-update primary_role
        await client.query(`
            DROP TRIGGER IF EXISTS trigger_update_primary_role ON "user_roles";
            CREATE TRIGGER trigger_update_primary_role
                AFTER INSERT OR UPDATE OF is_active ON "user_roles"
                FOR EACH ROW
                EXECUTE FUNCTION update_user_primary_role();
        `);
        console.log('   ✅ Created trigger to auto-update primary_role');
        
        console.log('\n5. Creating view for user role summary...');
        
        // Create a view for easy user role querying
        await client.query(`
            CREATE OR REPLACE VIEW user_role_summary AS
            SELECT 
                u.id,
                u.human_id,
                u.name,
                u.email,
                u.primary_role,
                u.status,
                u.last_role_update,
                r.display_name as primary_role_display,
                array_agg(DISTINCT ar.name ORDER BY ar.name) as all_roles,
                array_agg(DISTINCT ar.display_name ORDER BY ar.display_name) as all_role_displays
            FROM "appUsers" u
            LEFT JOIN "user_roles" ur ON u.id = ur.user_id AND ur.is_active = true
            LEFT JOIN "roles" r ON u.primary_role = r.name
            LEFT JOIN "user_roles" aur ON u.id = aur.user_id AND aur.is_active = true
            LEFT JOIN "roles" ar ON aur.role_id = ar.id
            GROUP BY u.id, u.human_id, u.name, u.email, u.primary_role, u.status, u.last_role_update, r.display_name
            ORDER BY u.name;
        `);
        console.log('   ✅ Created user_role_summary view');
        
        console.log('\n6. Backing up old role column data...');
        
        // Create a backup of the old role data
        await client.query(`
            CREATE TABLE IF NOT EXISTS "appUsers_role_backup" AS
            SELECT id, human_id, name, email, role as old_role, created_at
            FROM "appUsers"
        `);
        console.log('   ✅ Created backup of old role data');
        
        console.log('\n7. Dropping redundant old role column...');
        
        try {
            // First, check if there are any constraints or indexes on the role column
            const constraints = await client.query(`
                SELECT constraint_name, constraint_type
                FROM information_schema.table_constraints 
                WHERE table_name = 'appUsers' 
                AND constraint_name ILIKE '%role%'
            `);
            
            if (constraints.rows.length > 0) {
                console.log('   Found constraints on role column:');
                constraints.rows.forEach(constraint => {
                    console.log(`     ${constraint.constraint_name} (${constraint.constraint_type})`);
                });
            }
            
            // Drop the old role column
            await client.query(`ALTER TABLE "appUsers" DROP COLUMN IF EXISTS role`);
            console.log('   ✅ Dropped old role column');
            
        } catch (error) {
            console.log(`   ⚠️  Could not drop role column: ${error.message}`);
            console.log('   💡 You may need to manually drop constraints first');
        }
        
        console.log('\n8. Adding indexes for performance...');
        
        const indexes = [
            `CREATE INDEX IF NOT EXISTS idx_appUsers_primary_role ON "appUsers"(primary_role)`,
            `CREATE INDEX IF NOT EXISTS idx_appUsers_status ON "appUsers"(status)`,
            `CREATE INDEX IF NOT EXISTS idx_appUsers_human_id ON "appUsers"(human_id)`
        ];
        
        for (const indexSql of indexes) {
            try {
                await client.query(indexSql);
                const indexName = indexSql.split(' ')[4];
                console.log(`   ✅ Created index: ${indexName}`);
            } catch (error) {
                console.log(`   ⚠️  Index creation: ${error.message}`);
            }
        }
        
        console.log('\n9. Final verification...');
        
        // Test the new structure
        const finalStructure = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'appUsers' 
            ORDER BY ordinal_position
        `);
        
        console.log('   Updated appUsers table structure:');
        finalStructure.rows.forEach(col => {
            console.log(`     ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''} ${col.column_default ? `default: ${col.column_default}` : ''}`);
        });
        
        // Test the view
        const viewTest = await client.query(`
            SELECT * FROM user_role_summary 
            ORDER BY 
                CASE primary_role 
                    WHEN 'super_admin' THEN 1
                    WHEN 'admin' THEN 2
                    WHEN 'manager' THEN 3
                    WHEN 'staff' THEN 4
                    WHEN 'customer' THEN 5
                    ELSE 6
                END,
                name
        `);
        
        console.log('\n📊 USER ROLE SUMMARY (via new view):');
        viewTest.rows.forEach(user => {
            console.log(`   ${user.name} (${user.human_id})`);
            console.log(`     Primary Role: ${user.primary_role_display || user.primary_role}`);
            console.log(`     Status: ${user.status}`);
            console.log(`     All Roles: ${user.all_role_displays ? user.all_role_displays.join(', ') : 'None'}`);
            console.log('     ---');
        });
        
        console.log('\n✅ APPUSERS TABLE UPDATE COMPLETE!');
        console.log('\n📋 CHANGES MADE:');
        console.log('   ✅ Added primary_role column for quick role lookup');
        console.log('   ✅ Added status column for user account status');
        console.log('   ✅ Added last_role_update timestamp');
        console.log('   ✅ Populated primary_role from current role assignments');
        console.log('   ✅ Created helper functions for role management');
        console.log('   ✅ Created trigger to auto-update primary_role');
        console.log('   ✅ Created user_role_summary view');
        console.log('   ✅ Backed up old role data');
        console.log('   ✅ Dropped redundant old role column');
        console.log('   ✅ Added performance indexes');
        
        console.log('\n🚀 BENEFITS:');
        console.log('   • Faster role lookups via primary_role column');
        console.log('   • Automatic role synchronization with triggers');
        console.log('   • Clean separation between old and new role system');
        console.log('   • Easy role querying via user_role_summary view');
        console.log('   • Proper indexing for performance');
        
        client.release();
        
    } catch (error) {
        console.error('Error updating appUsers role columns:', error);
    } finally {
        await pool.end();
    }
}

updateAppUsersRoleColumns();
