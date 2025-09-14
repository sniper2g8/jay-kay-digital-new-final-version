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

async function fixAuthAppUsersMismatch() {
    try {
        const client = await pool.connect();
        
        console.log('=== FIXING UUID MISMATCH BETWEEN AUTH AND APPUSERS ===\n');
        
        console.log('1. Checking current auth.users...');
        
        const authUsers = await client.query(`
            SELECT id, email, created_at 
            FROM auth.users 
            ORDER BY created_at
        `);
        
        console.log(`Found ${authUsers.rows.length} users in auth.users:`);
        authUsers.rows.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`);
        });
        
        console.log('\n2. Checking current appUsers...');
        
        const appUsers = await client.query(`
            SELECT id, email, name, role 
            FROM "appUsers" 
            ORDER BY created_at
        `);
        
        console.log(`Found ${appUsers.rows.length} users in appUsers:`);
        appUsers.rows.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.email} - ${user.name} (ID: ${user.id}) [${user.role}]`);
        });
        
        console.log('\n3. Finding mismatches...');
        
        // Try to match by email
        const mismatches = [];
        const matches = [];
        
        for (const appUser of appUsers.rows) {
            const authUser = authUsers.rows.find(au => au.email === appUser.email);
            if (authUser) {
                if (authUser.id !== appUser.id) {
                    mismatches.push({
                        email: appUser.email,
                        authId: authUser.id,
                        appUserId: appUser.id,
                        name: appUser.name,
                        role: appUser.role
                    });
                } else {
                    matches.push({ email: appUser.email, id: appUser.id });
                }
            } else {
                console.log(`   ⚠️  appUser ${appUser.email} not found in auth.users`);
            }
        }
        
        console.log(`   Found ${matches.length} matching UUIDs`);
        console.log(`   Found ${mismatches.length} UUID mismatches`);
        
        if (mismatches.length > 0) {
            console.log('\n   Mismatches to fix:');
            mismatches.forEach(mismatch => {
                console.log(`     ${mismatch.email}:`);
                console.log(`       Auth ID:    ${mismatch.authId}`);
                console.log(`       AppUser ID: ${mismatch.appUserId}`);
            });
            
            console.log('\n4. Fixing UUID mismatches...');
            
            // Option 1: Update appUsers to match auth.users IDs (recommended)
            console.log('   Updating appUsers to match auth.users UUIDs...');
            
            for (const mismatch of mismatches) {
                try {
                    await client.query(`
                        UPDATE "appUsers" 
                        SET id = $1 
                        WHERE email = $2
                    `, [mismatch.authId, mismatch.email]);
                    
                    console.log(`     ✅ Updated ${mismatch.email}: ${mismatch.appUserId} → ${mismatch.authId}`);
                    
                } catch (error) {
                    console.log(`     ❌ Error updating ${mismatch.email}: ${error.message}`);
                }
            }
            
        } else {
            console.log('   ✅ All UUIDs already match!');
        }
        
        console.log('\n5. Checking for orphaned records...');
        
        // Check for appUsers without corresponding auth users
        const orphanedAppUsers = await client.query(`
            SELECT au.id, au.email, au.name, au.role
            FROM "appUsers" au
            LEFT JOIN auth.users auth ON au.id = auth.id
            WHERE auth.id IS NULL
        `);
        
        if (orphanedAppUsers.rows.length > 0) {
            console.log(`   Found ${orphanedAppUsers.rows.length} orphaned appUsers (no auth record):`);
            orphanedAppUsers.rows.forEach(user => {
                console.log(`     ${user.email} - ${user.name} (ID: ${user.id})`);
            });
            
            console.log('   Note: These users cannot login without auth records');
        } else {
            console.log('   ✅ No orphaned appUsers found');
        }
        
        // Check for auth users without corresponding appUsers
        const orphanedAuthUsers = await client.query(`
            SELECT auth.id, auth.email, auth.created_at
            FROM auth.users auth
            LEFT JOIN "appUsers" au ON auth.id = au.id
            WHERE au.id IS NULL
        `);
        
        if (orphanedAuthUsers.rows.length > 0) {
            console.log(`   Found ${orphanedAuthUsers.rows.length} auth users without appUser records:`);
            orphanedAuthUsers.rows.forEach(user => {
                console.log(`     ${user.email} (ID: ${user.id})`);
            });
            
            console.log('   Creating appUser records for orphaned auth users...');
            
            for (const authUser of orphanedAuthUsers.rows) {
                try {
                    await client.query(`
                        INSERT INTO "appUsers" (id, email, name, role, created_at, updated_at)
                        VALUES ($1, $2, $3, $4, $5, NOW())
                    `, [
                        authUser.id,
                        authUser.email,
                        authUser.email.split('@')[0], // Use email prefix as name
                        'user', // Default role
                        authUser.created_at
                    ]);
                    
                    console.log(`     ✅ Created appUser for ${authUser.email}`);
                    
                } catch (error) {
                    console.log(`     ❌ Error creating appUser for ${authUser.email}: ${error.message}`);
                }
            }
        } else {
            console.log('   ✅ No orphaned auth users found');
        }
        
        console.log('\n6. Final verification...');
        
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
            console.log('🎉 Perfect sync! All auth.users have matching appUsers with same UUIDs');
        } else {
            console.log('⚠️  Some records still need attention');
        }
        
        client.release();
        
    } catch (error) {
        console.error('Error fixing auth/appUsers mismatch:', error);
    } finally {
        await pool.end();
    }
}

fixAuthAppUsersMismatch();
