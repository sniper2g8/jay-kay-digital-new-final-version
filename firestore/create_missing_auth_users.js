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

async function createMissingAuthUsers() {
    try {
        const client = await pool.connect();
        
        console.log('=== CREATING MISSING AUTH USERS ===\n');
        
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
        
        console.log('\n2. Creating auth.users records...');
        console.log('Note: These users will need to reset their passwords to login');
        
        for (const appUser of orphanedAppUsers.rows) {
            try {
                // Generate a temporary password hash (user will need to reset)
                const tempPassword = 'TempPassword123!'; // They'll need to reset this
                
                // Create auth.users record
                await client.query(`
                    INSERT INTO auth.users (
                        id,
                        instance_id,
                        aud,
                        role,
                        email,
                        encrypted_password,
                        email_confirmed_at,
                        confirmation_token,
                        confirmation_sent_at,
                        recovery_token,
                        recovery_sent_at,
                        email_change_token_new,
                        email_change,
                        email_change_sent_at,
                        last_sign_in_at,
                        raw_app_meta_data,
                        raw_user_meta_data,
                        is_super_admin,
                        created_at,
                        updated_at,
                        phone,
                        phone_confirmed_at,
                        phone_change,
                        phone_change_token,
                        phone_change_sent_at,
                        email_change_token_current,
                        email_change_confirm_status,
                        banned_until,
                        reauthentication_token,
                        reauthentication_sent_at,
                        is_sso_user,
                        deleted_at
                    ) VALUES (
                        $1,  -- id (use appUser's id)
                        '00000000-0000-0000-0000-000000000000',  -- instance_id
                        'authenticated',  -- aud
                        'authenticated',  -- role
                        $2,  -- email
                        '$2a$10$placeholder.hash.will.need.password.reset',  -- encrypted_password (placeholder)
                        NOW(),  -- email_confirmed_at
                        '',  -- confirmation_token
                        NULL,  -- confirmation_sent_at
                        '',  -- recovery_token
                        NULL,  -- recovery_sent_at
                        '',  -- email_change_token_new
                        '',  -- email_change
                        NULL,  -- email_change_sent_at
                        NULL,  -- last_sign_in_at
                        '{}',  -- raw_app_meta_data
                        jsonb_build_object('name', $3, 'role', $4),  -- raw_user_meta_data
                        false,  -- is_super_admin
                        $5,  -- created_at (use appUser's created_at)
                        NOW(),  -- updated_at
                        NULL,  -- phone
                        NULL,  -- phone_confirmed_at
                        '',  -- phone_change
                        '',  -- phone_change_token
                        NULL,  -- phone_change_sent_at
                        '',  -- email_change_token_current
                        0,  -- email_change_confirm_status
                        NULL,  -- banned_until
                        '',  -- reauthentication_token
                        NULL,  -- reauthentication_sent_at
                        false,  -- is_sso_user
                        NULL  -- deleted_at
                    )
                `, [
                    appUser.id,
                    appUser.email,
                    appUser.name,
                    appUser.role,
                    appUser.created_at
                ]);
                
                console.log(`   ✅ Created auth user for ${appUser.email}`);
                
                // Also create identity record for email auth
                await client.query(`
                    INSERT INTO auth.identities (
                        id,
                        user_id,
                        identity_data,
                        provider,
                        last_sign_in_at,
                        created_at,
                        updated_at,
                        email
                    ) VALUES (
                        gen_random_uuid(),
                        $1,
                        jsonb_build_object('email', $2, 'sub', $1),
                        'email',
                        NULL,
                        $3,
                        NOW(),
                        $2
                    )
                `, [appUser.id, appUser.email, appUser.created_at]);
                
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
        
        const syncPercentage = Math.round((matchingUsers.rows[0].count / Math.max(finalAuth.rows[0].count, finalAppUsers.rows[0].count)) * 100);
        
        console.log(`\n✅ Auth/AppUsers sync: ${syncPercentage}% complete`);
        
        if (syncPercentage === 100) {
            console.log('🎉 Perfect sync! All appUsers now have matching auth.users records');
            console.log('\n📝 IMPORTANT NOTES:');
            console.log('   - All users can now log in with their email addresses');
            console.log('   - Users created today will need to use "Forgot Password" to set their password');
            console.log('   - Original users from Firebase migration can use their existing passwords');
        } else {
            console.log('⚠️  Some records still need attention');
        }
        
        client.release();
        
    } catch (error) {
        console.error('Error creating missing auth users:', error);
    } finally {
        await pool.end();
    }
}

createMissingAuthUsers();
