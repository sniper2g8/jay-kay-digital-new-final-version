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

async function migrateUsersToRoles() {
    try {
        const client = await pool.connect();
        
        console.log('=== MIGRATING APPUSERS TO ROLE-BASED SYSTEM ===\n');
        
        console.log('1. Checking current appUsers and their roles...');
        
        // Get all current users with their roles
        const currentUsers = await client.query(`
            SELECT id, human_id, name, email, role, created_at 
            FROM "appUsers" 
            ORDER BY created_at
        `);
        
        console.log(`Found ${currentUsers.rows.length} users to migrate:`);
        currentUsers.rows.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role} - ID: ${user.human_id}`);
        });
        
        console.log('\n2. Getting role IDs from roles table...');
        
        // Get all role IDs
        const roles = await client.query(`
            SELECT id, name, display_name 
            FROM "roles" 
            ORDER BY name
        `);
        
        const roleMap = {};
        roles.rows.forEach(role => {
            roleMap[role.name] = role.id;
            console.log(`   ${role.name} -> ${role.id} (${role.display_name})`);
        });
        
        console.log('\n3. Mapping existing user roles to new role system...');
        
        // Role mapping from old to new
        const roleMappings = {
            'admin': 'admin',
            'customer': 'customer',
            'staff': 'staff',
            'user': 'customer', // Default fallback
            'manager': 'manager'
        };
        
        console.log('   Role mappings:');
        Object.entries(roleMappings).forEach(([oldRole, newRole]) => {
            console.log(`     ${oldRole} -> ${newRole}`);
        });
        
        console.log('\n4. Migrating users to user_roles table...');
        
        let migratedCount = 0;
        let errors = [];
        
        for (const user of currentUsers.rows) {
            try {
                // Determine the new role
                const oldRole = user.role?.toLowerCase() || 'user';
                const newRoleName = roleMappings[oldRole] || 'customer';
                const newRoleId = roleMap[newRoleName];
                
                if (!newRoleId) {
                    throw new Error(`Role ID not found for ${newRoleName}`);
                }
                
                // Check if user already has this role assigned
                const existingAssignment = await client.query(`
                    SELECT id FROM "user_roles" 
                    WHERE user_id = $1 AND role_id = $2
                `, [user.id, newRoleId]);
                
                if (existingAssignment.rows.length === 0) {
                    // Insert user-role assignment
                    await client.query(`
                        INSERT INTO "user_roles" (user_id, role_id, assigned_at, is_active)
                        VALUES ($1, $2, $3, true)
                    `, [user.id, newRoleId, user.created_at]);
                    
                    console.log(`   ✅ ${user.name}: ${oldRole} -> ${newRoleName}`);
                    migratedCount++;
                } else {
                    console.log(`   ⚠️  ${user.name}: Already assigned to ${newRoleName} role`);
                }
                
            } catch (error) {
                const errorMsg = `${user.name} (${user.email}): ${error.message}`;
                errors.push(errorMsg);
                console.log(`   ❌ ${errorMsg}`);
            }
        }
        
        console.log('\n5. Setting up role permissions for each role...');
        
        // Define permissions for each role
        const rolePermissions = {
            'super_admin': ['*'], // All permissions
            'admin': [
                'jobs.*', 'customers.*', 'invoices.*', 'payments.*', 
                'inventory.*', 'users.read', 'users.update', 'system.reports', 'system.analytics'
            ],
            'manager': [
                'jobs.*', 'customers.*', 'invoices.*', 'payments.*', 
                'inventory.read', 'inventory.update', 'system.reports'
            ],
            'staff': [
                'jobs.read', 'jobs.update', 'jobs.create', 'customers.read', 'customers.update',
                'invoices.read', 'payments.read', 'payments.create'
            ],
            'customer': [
                'jobs.read', 'invoices.read' // Only own data via RLS
            ]
        };
        
        // Get all permissions
        const allPermissions = await client.query(`SELECT id, name FROM "permissions"`);
        const permissionMap = {};
        allPermissions.rows.forEach(perm => {
            permissionMap[perm.name] = perm.id;
        });
        
        for (const [roleName, permissions] of Object.entries(rolePermissions)) {
            const roleId = roleMap[roleName];
            if (!roleId) continue;
            
            console.log(`   Setting permissions for ${roleName}...`);
            
            if (permissions.includes('*')) {
                // Super admin gets all permissions
                for (const permission of allPermissions.rows) {
                    try {
                        await client.query(`
                            INSERT INTO "role_permissions" (role_id, permission_id, granted_at)
                            VALUES ($1, $2, NOW())
                            ON CONFLICT (role_id, permission_id) DO NOTHING
                        `, [roleId, permission.id]);
                    } catch (error) {
                        // Ignore conflicts
                    }
                }
                console.log(`     ✅ Granted ALL permissions to ${roleName}`);
            } else {
                // Grant specific permissions
                let grantedCount = 0;
                for (const permPattern of permissions) {
                    if (permPattern.endsWith('.*')) {
                        // Grant all permissions for a module
                        const module = permPattern.replace('.*', '');
                        const modulePermissions = allPermissions.rows.filter(p => p.name.startsWith(module + '.'));
                        
                        for (const perm of modulePermissions) {
                            try {
                                await client.query(`
                                    INSERT INTO "role_permissions" (role_id, permission_id, granted_at)
                                    VALUES ($1, $2, NOW())
                                    ON CONFLICT (role_id, permission_id) DO NOTHING
                                `, [roleId, perm.id]);
                                grantedCount++;
                            } catch (error) {
                                // Ignore conflicts
                            }
                        }
                    } else {
                        // Grant specific permission
                        const permId = permissionMap[permPattern];
                        if (permId) {
                            try {
                                await client.query(`
                                    INSERT INTO "role_permissions" (role_id, permission_id, granted_at)
                                    VALUES ($1, $2, NOW())
                                    ON CONFLICT (role_id, permission_id) DO NOTHING
                                `, [roleId, permId]);
                                grantedCount++;
                            } catch (error) {
                                // Ignore conflicts
                            }
                        }
                    }
                }
                console.log(`     ✅ Granted ${grantedCount} permissions to ${roleName}`);
            }
        }
        
        console.log('\n6. Creating helper function for role checking...');
        
        // Create function to check user permissions
        await client.query(`
            CREATE OR REPLACE FUNCTION user_has_permission(user_uuid UUID, permission_name TEXT)
            RETURNS BOOLEAN AS $$
            DECLARE
                has_permission BOOLEAN := FALSE;
            BEGIN
                SELECT EXISTS(
                    SELECT 1 
                    FROM "user_roles" ur
                    JOIN "role_permissions" rp ON ur.role_id = rp.role_id
                    JOIN "permissions" p ON rp.permission_id = p.id
                    WHERE ur.user_id = user_uuid 
                    AND ur.is_active = true
                    AND p.name = permission_name
                ) INTO has_permission;
                
                RETURN has_permission;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
        `);
        console.log('   ✅ Created user_has_permission function');
        
        // Create function to get user roles
        await client.query(`
            CREATE OR REPLACE FUNCTION get_user_roles(user_uuid UUID)
            RETURNS TABLE(role_name TEXT, role_display_name TEXT) AS $$
            BEGIN
                RETURN QUERY
                SELECT r.name, r.display_name
                FROM "user_roles" ur
                JOIN "roles" r ON ur.role_id = r.id
                WHERE ur.user_id = user_uuid 
                AND ur.is_active = true;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
        `);
        console.log('   ✅ Created get_user_roles function');
        
        console.log('\n7. Final verification...');
        
        // Verify the migration
        const migrationResults = await client.query(`
            SELECT 
                u.human_id,
                u.name,
                u.email,
                u.role as old_role,
                r.name as new_role,
                r.display_name,
                ur.assigned_at
            FROM "appUsers" u
            JOIN "user_roles" ur ON u.id = ur.user_id
            JOIN "roles" r ON ur.role_id = r.id
            WHERE ur.is_active = true
            ORDER BY u.created_at
        `);
        
        console.log('\nMigration Results:');
        migrationResults.rows.forEach(result => {
            console.log(`   ${result.name} (${result.human_id})`);
            console.log(`     Old: ${result.old_role} -> New: ${result.new_role} (${result.display_name})`);
            console.log(`     Assigned: ${result.assigned_at}`);
            console.log('     ---');
        });
        
        // Count permissions per role
        console.log('\nRole Permission Summary:');
        const permissionCounts = await client.query(`
            SELECT 
                r.name,
                r.display_name,
                COUNT(rp.permission_id) as permission_count
            FROM "roles" r
            LEFT JOIN "role_permissions" rp ON r.id = rp.role_id
            GROUP BY r.id, r.name, r.display_name
            ORDER BY r.name
        `);
        
        permissionCounts.rows.forEach(count => {
            console.log(`   ${count.display_name}: ${count.permission_count} permissions`);
        });
        
        console.log(`\n✅ MIGRATION COMPLETE!`);
        console.log(`   📊 Users migrated: ${migratedCount}/${currentUsers.rows.length}`);
        console.log(`   🔐 Roles active: ${roles.rows.length}`);
        console.log(`   ⚡ Permissions configured: ${allPermissions.rows.length}`);
        
        if (errors.length > 0) {
            console.log(`\n❌ Errors encountered:`);
            errors.forEach(error => console.log(`     ${error}`));
        }
        
        console.log('\n🎉 Role-based access control system is now active!');
        console.log('\n📝 NEXT STEPS:');
        console.log('   1. Set up Row Level Security (RLS) policies using the role functions');
        console.log('   2. Update your frontend to use role-based UI components');
        console.log('   3. Test permission checking with user_has_permission() function');
        console.log('   4. Configure Supabase Auth to populate user roles in JWT');
        
        client.release();
        
    } catch (error) {
        console.error('Error migrating users to roles:', error);
    } finally {
        await pool.end();
    }
}

migrateUsersToRoles();
