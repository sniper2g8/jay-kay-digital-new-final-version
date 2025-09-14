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

async function createMissingAuthUsersSimple() {
    try {
        const client = await pool.connect();
        
        console.log('=== CREATING MISSING AUTH USERS (SIMPLIFIED) ===\n');
        
        console.log('1. Finding appUsers without auth records...');
        
        const orphanedAppUsers = await client.query(`
            SELECT au.id, au.email, au.name, au.role, au.created_at
            FROM "appUsers" au
            LEFT JOIN auth.users auth ON au.id = auth.id
            WHERE auth.id IS NULL
        `);
        
        console.log(`Found ${orphanedAppUsers.rows.length} appUsers without auth records:`);
        orphanedAppUsers.rows.forEach(user => {
            console.log(`   ${user.email} - ${user.name} (${user.role})`);
        });
        
        if (orphanedAppUsers.rows.length === 0) {
            console.log('✅ All appUsers have corresponding auth records!');
            client.release();
            return;
        }
        
        console.log('\n2. Creating auth.users records with minimal fields...');
        
        for (const appUser of orphanedAppUsers.rows) {
            try {
                // Create basic auth.users record
                await client.query(`
                    INSERT INTO auth.users (
                        id,
                        instance_id,
                        aud,
                        role,
                        email,
                        encrypted_password,
                        email_confirmed_at,
                        raw_app_meta_data,
                        raw_user_meta_data,
                        is_super_admin,
                        created_at,
                        updated_at,
                        is_sso_user
                    ) VALUES (
                        $1::uuid,
                        '00000000-0000-0000-0000-000000000000'::uuid,
                        'authenticated',
                        'authenticated',
                        $2,
                        '$2a$10$placeholder.hash.will.need.password.reset',
                        NOW(),
                        '{}'::jsonb,
                        $3::jsonb,
                        false,
                        $4::timestamptz,
                        NOW(),
                        false
                    )
                `, [
                    appUser.id,
                    appUser.email,
                    JSON.stringify({ name: appUser.name, role: appUser.role }),
                    appUser.created_at
                ]);
                
                console.log(`   ✅ Created auth user for ${appUser.email}`);
                
                // Create identity record
                await client.query(`
                    INSERT INTO auth.identities (
                        id,
                        user_id,
                        identity_data,
                        provider,
                        created_at,
                        updated_at,
                        email
                    ) VALUES (
                        gen_random_uuid(),
                        $1::uuid,
                        $2::jsonb,
                        'email',
                        $3::timestamptz,
                        NOW(),
                        $4
                    )
                `, [
                    appUser.id, 
                    JSON.stringify({ email: appUser.email, sub: appUser.id }),
                    appUser.created_at,
                    appUser.email
                ]);
                
                console.log(`   ✅ Created identity for ${appUser.email}`);
                
            } catch (error) {
                console.log(`   ❌ Error creating auth user for ${appUser.email}: ${error.message}`);
            }
        }
        
        console.log('\n3. Final verification...');
        
        const finalAuth = await client.query('SELECT COUNT(*) FROM auth.users');
        const finalAppUsers = await client.query('SELECT COUNT(*) FROM "appUsers"');
        const matchingUsers = await client.query(`
            SELECT COUNT(*) 
            FROM auth.users auth
            INNER JOIN "appUsers" au ON auth.id = au.id
        `);
        
        console.log(`   Auth users: ${finalAuth.rows[0].count}`);
        console.log(`   App users: ${finalAppUsers.rows[0].count}`);
        console.log(`   Matching records: ${matchingUsers.rows[0].count}`);
        
        if (finalAuth.rows[0].count === finalAppUsers.rows[0].count && 
            matchingUsers.rows[0].count === finalAuth.rows[0].count) {
            console.log('\n🎉 Perfect sync! All appUsers now have matching auth.users records');
            console.log('\n📝 IMPORTANT NOTES:');
            console.log('   - All users can now log in with their email addresses');
            console.log('   - New users created today will need to use "Forgot Password" to set their password');
            console.log('   - Original users from Firebase migration can use their existing passwords');
        } else {
            console.log('\n⚠️  Some records still need attention');
        }
        
        client.release();
        
    } catch (error) {
        console.error('Error creating missing auth users:', error);
    } finally {
        await pool.end();
    }
}

createMissingAuthUsersSimple();
