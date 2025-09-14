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

async function promoteSmaliaToSuperAdmin() {
    try {
        const client = await pool.connect();
        
        console.log('=== PROMOTING SMAILA MENSAH TO SUPER ADMIN ===\n');
        
        console.log('1. Finding Smaila Mensah user...');
        
        // Find Smaila Mensah
        const smaila = await client.query(`
            SELECT id, human_id, name, email, role 
            FROM "appUsers" 
            WHERE email = 'smailamensah@gmail.com' OR name ILIKE '%smaila%'
        `);
        
        if (smaila.rows.length === 0) {
            console.log('❌ Smaila Mensah not found');
            return;
        }
        
        const smailaUser = smaila.rows[0];
        console.log(`   ✅ Found: ${smailaUser.name} (${smailaUser.email}) - ID: ${smailaUser.human_id}`);
        
        console.log('\n2. Getting role IDs...');
        
        // Get super_admin and admin role IDs
        const roles = await client.query(`
            SELECT id, name, display_name 
            FROM "roles" 
            WHERE name IN ('super_admin', 'admin')
        `);
        
        const superAdminRole = roles.rows.find(r => r.name === 'super_admin');
        const adminRole = roles.rows.find(r => r.name === 'admin');
        
        if (!superAdminRole) {
            console.log('❌ Super admin role not found');
            return;
        }
        
        console.log(`   Super Admin Role ID: ${superAdminRole.id}`);
        console.log(`   Admin Role ID: ${adminRole?.id}`);
        
        console.log('\n3. Checking current role assignments...');
        
        const currentRoles = await client.query(`
            SELECT ur.id, r.name, r.display_name, ur.assigned_at, ur.is_active
            FROM "user_roles" ur
            JOIN "roles" r ON ur.role_id = r.id
            WHERE ur.user_id = $1
            ORDER BY ur.assigned_at DESC
        `, [smailaUser.id]);
        
        console.log('   Current role assignments:');
        currentRoles.rows.forEach(role => {
            console.log(`     ${role.display_name} (${role.name}) - Active: ${role.is_active} - Assigned: ${role.assigned_at}`);
        });
        
        console.log('\n4. Updating role assignment...');
        
        // Check if already has super_admin role
        const hasSuperAdmin = currentRoles.rows.find(r => r.name === 'super_admin' && r.is_active);
        
        if (hasSuperAdmin) {
            console.log('   ✅ Smaila already has Super Admin role');
        } else {
            // Deactivate current admin role
            if (adminRole) {
                await client.query(`
                    UPDATE "user_roles" 
                    SET is_active = false
                    WHERE user_id = $1 AND role_id = $2
                `, [smailaUser.id, adminRole.id]);
                console.log('   ✅ Deactivated admin role');
            }
            
            // Add super_admin role
            await client.query(`
                INSERT INTO "user_roles" (user_id, role_id, assigned_at, is_active)
                VALUES ($1, $2, NOW(), true)
                ON CONFLICT (user_id, role_id) 
                DO UPDATE SET is_active = true, assigned_at = NOW()
            `, [smailaUser.id, superAdminRole.id]);
            
            console.log('   ✅ Assigned Super Admin role');
        }
        
        console.log('\n5. Verification...');
        
        // Verify the change
        const updatedRoles = await client.query(`
            SELECT ur.id, r.name, r.display_name, ur.assigned_at, ur.is_active
            FROM "user_roles" ur
            JOIN "roles" r ON ur.role_id = r.id
            WHERE ur.user_id = $1
            ORDER BY ur.assigned_at DESC
        `, [smailaUser.id]);
        
        console.log('   Updated role assignments:');
        updatedRoles.rows.forEach(role => {
            const status = role.is_active ? '✅ Active' : '❌ Inactive';
            console.log(`     ${role.display_name} (${role.name}) - ${status} - Assigned: ${role.assigned_at}`);
        });
        
        // Test permissions
        console.log('\n6. Testing super admin permissions...');
        
        const permissionTest = await client.query(`
            SELECT user_has_permission($1, 'system.settings') as has_system_settings,
                   user_has_permission($1, 'users.delete') as has_user_delete,
                   user_has_permission($1, 'jobs.delete') as has_job_delete
        `, [smailaUser.id]);
        
        const permissions = permissionTest.rows[0];
        console.log(`   System Settings: ${permissions.has_system_settings ? '✅' : '❌'}`);
        console.log(`   Delete Users: ${permissions.has_user_delete ? '✅' : '❌'}`);
        console.log(`   Delete Jobs: ${permissions.has_job_delete ? '✅' : '❌'}`);
        
        // Get all roles for the user
        const userRoles = await client.query(`SELECT * FROM get_user_roles($1)`, [smailaUser.id]);
        console.log('\n   Active roles:');
        userRoles.rows.forEach(role => {
            console.log(`     ${role.role_display_name} (${role.role_name})`);
        });
        
        console.log('\n✅ PROMOTION COMPLETE!');
        console.log(`   🎉 ${smailaUser.name} is now a Super Administrator`);
        console.log('   🔓 Has access to all system functions and settings');
        console.log('   🛡️  Can manage all users, roles, and permissions');
        
        client.release();
        
    } catch (error) {
        console.error('Error promoting Smaila to super admin:', error);
    } finally {
        await pool.end();
    }
}

promoteSmaliaToSuperAdmin();
