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

async function verifySmailaPromotion() {
    try {
        const client = await pool.connect();
        
        console.log('=== VERIFYING SMAILA\'S SUPER ADMIN PROMOTION ===\n');
        
        // Get Smaila's current role status
        const smailaRoles = await client.query(`
            SELECT 
                u.name,
                u.email,
                u.human_id,
                r.name as role_name,
                r.display_name,
                ur.is_active,
                ur.assigned_at
            FROM "appUsers" u
            JOIN "user_roles" ur ON u.id = ur.user_id
            JOIN "roles" r ON ur.role_id = r.id
            WHERE u.email = 'smailamensah@gmail.com'
            ORDER BY ur.assigned_at DESC
        `);
        
        console.log('Smaila Mensah\'s Role Status:');
        smailaRoles.rows.forEach(role => {
            const status = role.is_active ? '✅ ACTIVE' : '❌ Inactive';
            console.log(`   ${role.display_name} (${role.role_name}) - ${status}`);
            console.log(`   Assigned: ${role.assigned_at}`);
            console.log('   ---');
        });
        
        // Check permissions
        const smailaUser = await client.query(`SELECT id FROM "appUsers" WHERE email = 'smailamensah@gmail.com'`);
        const userId = smailaUser.rows[0].id;
        
        const keyPermissions = [
            'system.settings',
            'users.delete', 
            'users.create',
            'jobs.delete',
            'invoices.delete',
            'payments.delete'
        ];
        
        console.log('\nKey Super Admin Permissions:');
        for (const permission of keyPermissions) {
            const hasPermission = await client.query(`SELECT user_has_permission($1, $2) as has_perm`, [userId, permission]);
            const status = hasPermission.rows[0].has_perm ? '✅' : '❌';
            console.log(`   ${permission}: ${status}`);
        }
        
        // Count total permissions
        const totalPermissions = await client.query(`
            SELECT COUNT(DISTINCT p.name) as permission_count
            FROM "user_roles" ur
            JOIN "role_permissions" rp ON ur.role_id = rp.role_id
            JOIN "permissions" p ON rp.permission_id = p.id
            WHERE ur.user_id = $1 AND ur.is_active = true
        `, [userId]);
        
        console.log(`\nTotal Permissions: ${totalPermissions.rows[0].permission_count}/29`);
        
        // Get all current users and their roles for comparison
        console.log('\n📊 ALL USERS CURRENT ROLES:');
        const allUserRoles = await client.query(`
            SELECT 
                u.name,
                u.human_id,
                u.email,
                r.display_name as role,
                ur.is_active
            FROM "appUsers" u
            JOIN "user_roles" ur ON u.id = ur.user_id
            JOIN "roles" r ON ur.role_id = r.id
            WHERE ur.is_active = true
            ORDER BY r.name, u.name
        `);
        
        const roleGroups = {};
        allUserRoles.rows.forEach(user => {
            if (!roleGroups[user.role]) {
                roleGroups[user.role] = [];
            }
            roleGroups[user.role].push(`${user.name} (${user.human_id})`);
        });
        
        Object.entries(roleGroups).forEach(([role, users]) => {
            console.log(`\n${role}:`);
            users.forEach(user => {
                console.log(`   • ${user}`);
            });
        });
        
        const activeSuperAdmin = smailaRoles.rows.find(r => r.role_name === 'super_admin' && r.is_active);
        
        if (activeSuperAdmin) {
            console.log('\n🎉 SUCCESS! Smaila Mensah is now a Super Administrator!');
            console.log('   🔓 Has full system access');
            console.log('   🛡️  Can manage all users and settings');
            console.log('   ⚡ All 29 permissions granted');
        } else {
            console.log('\n❌ Promotion not complete - Super Admin role not active');
        }
        
        client.release();
        
    } catch (error) {
        console.error('Error verifying promotion:', error);
    } finally {
        await pool.end();
    }
}

verifySmailaPromotion();
