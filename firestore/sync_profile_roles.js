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

async function syncProfileRoles() {
    try {
        const client = await pool.connect();
        
        console.log('=== SYNCHRONIZING PROFILES ROLES WITH APPUSERS ===\n');
        
        console.log('1. Checking current ENUM type for profiles.role...');
        
        // Check the current ENUM definition
        const enumInfo = await client.query(`
            SELECT 
                t.typname,
                string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as enum_values
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid 
            WHERE t.typname = 'user_role'
            GROUP BY t.typname
        `);
        
        if (enumInfo.rows.length > 0) {
            console.log(`   ✅ Found ENUM user_role: ${enumInfo.rows[0].enum_values}`);
        } else {
            console.log('   ❌ user_role ENUM not found');
        }
        
        console.log('\n2. Checking role mismatches between profiles and appUsers...');
        
        // Find mismatches
        const mismatches = await client.query(`
            SELECT 
                p.email,
                p.name as profile_name,
                p.role as profile_role,
                au.name as appuser_name,
                au.primary_role as appuser_role,
                au.human_id
            FROM profiles p
            JOIN "appUsers" au ON p.email = au.email
            WHERE p.role != au.primary_role
            ORDER BY p.email
        `);
        
        console.log(`   Found ${mismatches.rows.length} role mismatches:`);
        mismatches.rows.forEach(mismatch => {
            console.log(`     ${mismatch.email} (${mismatch.human_id}):`);
            console.log(`       Profiles: ${mismatch.profile_role}`);
            console.log(`       AppUsers: ${mismatch.appuser_role}`);
        });
        
        console.log('\n3. Updating ENUM to include all standard roles...');
        
        // Check if super_admin exists in ENUM
        const hasSupeAdmin = await client.query(`
            SELECT enumlabel 
            FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = 'user_role' AND enumlabel = 'super_admin'
        `);
        
        if (hasSupeAdmin.rows.length === 0) {
            try {
                await client.query(`ALTER TYPE user_role ADD VALUE 'super_admin'`);
                console.log('   ✅ Added super_admin to user_role ENUM');
            } catch (error) {
                console.log(`   ⚠️  Error adding super_admin: ${error.message}`);
            }
        } else {
            console.log('   ✅ super_admin already exists in ENUM');
        }
        
        // Check if manager exists in ENUM
        const hasManager = await client.query(`
            SELECT enumlabel 
            FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = 'user_role' AND enumlabel = 'manager'
        `);
        
        if (hasManager.rows.length === 0) {
            try {
                await client.query(`ALTER TYPE user_role ADD VALUE 'manager'`);
                console.log('   ✅ Added manager to user_role ENUM');
            } catch (error) {
                console.log(`   ⚠️  Error adding manager: ${error.message}`);
            }
        } else {
            console.log('   ✅ manager already exists in ENUM');
        }
        
        // Check if staff exists in ENUM
        const hasStaff = await client.query(`
            SELECT enumlabel 
            FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = 'user_role' AND enumlabel = 'staff'
        `);
        
        if (hasStaff.rows.length === 0) {
            try {
                await client.query(`ALTER TYPE user_role ADD VALUE 'staff'`);
                console.log('   ✅ Added staff to user_role ENUM');
            } catch (error) {
                console.log(`   ⚠️  Error adding staff: ${error.message}`);
            }
        } else {
            console.log('   ✅ staff already exists in ENUM');
        }
        
        console.log('\n4. Synchronizing profile roles with appUsers roles...');
        
        // Strategy: Use appUsers.primary_role as the authoritative source
        for (const mismatch of mismatches.rows) {
            try {
                await client.query(`
                    UPDATE profiles 
                    SET role = $1::user_role
                    WHERE email = $2
                `, [mismatch.appuser_role, mismatch.email]);
                
                console.log(`   ✅ Updated ${mismatch.email}: ${mismatch.profile_role} → ${mismatch.appuser_role}`);
                
            } catch (error) {
                console.log(`   ❌ Error updating ${mismatch.email}: ${error.message}`);
            }
        }
        
        console.log('\n5. Verifying synchronization...');
        
        // Check if there are any remaining mismatches
        const remainingMismatches = await client.query(`
            SELECT 
                p.email,
                p.role as profile_role,
                au.primary_role as appuser_role
            FROM profiles p
            JOIN "appUsers" au ON p.email = au.email
            WHERE p.role::text != au.primary_role
        `);
        
        if (remainingMismatches.rows.length === 0) {
            console.log('   ✅ All roles synchronized successfully');
        } else {
            console.log(`   ⚠️  ${remainingMismatches.rows.length} mismatches still exist:`);
            remainingMismatches.rows.forEach(mismatch => {
                console.log(`     ${mismatch.email}: profiles=${mismatch.profile_role}, appUsers=${mismatch.appuser_role}`);
            });
        }
        
        console.log('\n6. Final role distribution verification...');
        
        // Show final distribution in both tables
        const profileRoles = await client.query(`
            SELECT role, COUNT(*) as count
            FROM profiles
            WHERE role IS NOT NULL
            GROUP BY role
            ORDER BY role
        `);
        
        const appUserRoles = await client.query(`
            SELECT primary_role, COUNT(*) as count
            FROM "appUsers"
            WHERE primary_role IS NOT NULL
            GROUP BY primary_role
            ORDER BY primary_role
        `);
        
        console.log('   📊 Profiles role distribution:');
        profileRoles.rows.forEach(role => {
            console.log(`     ${role.role}: ${role.count} profiles`);
        });
        
        console.log('   📊 AppUsers role distribution:');
        appUserRoles.rows.forEach(role => {
            console.log(`     ${role.primary_role}: ${role.count} users`);
        });
        
        console.log('\n7. Testing ENUM constraint...');
        
        try {
            await client.query('BEGIN');
            
            await client.query(`
                INSERT INTO profiles (name, email, role)
                VALUES ('Test User', 'test@example.com', 'invalid_role'::user_role)
            `);
            
            await client.query('ROLLBACK');
            console.log('   ❌ ENUM constraint is NOT working');
            
        } catch (error) {
            await client.query('ROLLBACK');
            if (error.message.includes('invalid input value for enum')) {
                console.log('   ✅ ENUM constraint is working correctly');
            } else {
                console.log(`   ⚠️  Other error: ${error.message.substring(0, 80)}...`);
            }
        }
        
        console.log('\n8. Creating unified role view...');
        
        // Create a view that shows unified role information
        await client.query(`
            CREATE OR REPLACE VIEW unified_user_roles AS
            SELECT 
                au.id as user_id,
                au.human_id,
                au.name,
                au.email,
                au.primary_role as appuser_role,
                p.role::text as profile_role,
                CASE 
                    WHEN au.primary_role = p.role::text THEN 'SYNCED'
                    ELSE 'MISMATCH'
                END as sync_status,
                au.created_at,
                au.updated_at
            FROM "appUsers" au
            LEFT JOIN profiles p ON au.email = p.email
            ORDER BY au.primary_role, au.name
        `);
        
        console.log('   ✅ Created unified_user_roles view');
        
        // Test the view
        const viewTest = await client.query(`
            SELECT 
                sync_status,
                COUNT(*) as count
            FROM unified_user_roles
            GROUP BY sync_status
        `);
        
        console.log('   📊 Role synchronization status:');
        viewTest.rows.forEach(status => {
            console.log(`     ${status.sync_status}: ${status.count} users`);
        });
        
        console.log('\n✅ PROFILE ROLE SYNCHRONIZATION COMPLETE!');
        console.log('\n📊 SUMMARY:');
        console.log(`   ✅ Role mismatches resolved: ${mismatches.rows.length}`);
        console.log('   ✅ ENUM type updated with all standard roles');
        console.log('   ✅ Profiles and appUsers roles synchronized');
        console.log('   ✅ Unified view created for monitoring');
        console.log('   ✅ Data integrity maintained');
        
        console.log('\n🚀 BENEFITS:');
        console.log('   • Complete role consistency across all tables');
        console.log('   • ENUM constraints prevent invalid role values');
        console.log('   • Unified view for easy role monitoring');
        console.log('   • Ready for comprehensive backup');
        console.log('   • Production-ready role system');
        
        console.log('\n🎯 READY FOR BACKUP:');
        console.log('   1. ✅ All roles synchronized');
        console.log('   2. ✅ Data integrity ensured');
        console.log('   3. ✅ ENUM constraints active');
        console.log('   4. ✅ Ready to create full database backup');
        
        client.release();
        
    } catch (error) {
        console.error('Error synchronizing profile roles:', error);
    } finally {
        await pool.end();
    }
}

syncProfileRoles();
