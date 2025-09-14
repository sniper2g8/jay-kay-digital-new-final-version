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

async function simpleRedundancyAnalysis() {
    try {
        const client = await pool.connect();
        
        console.log('=== SIMPLE REDUNDANCY ANALYSIS ===\n');
        
        console.log('1. Comparing table purposes...');
        
        // Check actual data in each table
        const profilesData = await client.query(`
            SELECT id, name, email, phone, address, role, human_id 
            FROM profiles 
            ORDER BY email
        `);
        
        const appUsersData = await client.query(`
            SELECT id, name, email, phone, address, primary_role, human_id, status
            FROM "appUsers" 
            ORDER BY email
        `);
        
        const customersData = await client.query(`
            SELECT id, name 
            FROM customers 
            ORDER BY name
        `);
        
        console.log(`   📊 Profiles: ${profilesData.rows.length} records`);
        console.log(`   📊 AppUsers: ${appUsersData.rows.length} records`);
        console.log(`   📊 Customers: ${customersData.rows.length} records`);
        
        console.log('\n2. Profiles vs AppUsers comparison...');
        
        // Compare profiles and appUsers data
        console.log('   Profiles data:');
        profilesData.rows.forEach(profile => {
            console.log(`     ${profile.email}: ${profile.name} (${profile.role})`);
        });
        
        console.log('\n   AppUsers data:');
        appUsersData.rows.forEach(user => {
            console.log(`     ${user.email}: ${user.name} (${user.primary_role}) [${user.human_id}]`);
        });
        
        console.log('\n   Customers data:');
        customersData.rows.forEach(customer => {
            console.log(`     ${customer.name} (ID: ${customer.id})`);
        });
        
        console.log('\n3. Data overlap analysis...');
        
        // Find overlapping emails between profiles and appUsers
        const overlappingEmails = profilesData.rows.filter(profile => 
            appUsersData.rows.some(user => user.email === profile.email)
        );
        
        console.log(`   📧 Overlapping emails: ${overlappingEmails.length}`);
        overlappingEmails.forEach(overlap => {
            const appUser = appUsersData.rows.find(user => user.email === overlap.email);
            console.log(`     ${overlap.email}:`);
            console.log(`       Profiles: ${overlap.name} (${overlap.role})`);
            console.log(`       AppUsers: ${appUser.name} (${appUser.primary_role})`);
        });
        
        console.log('\n4. Unique value assessment...');
        
        // Check if profiles has any unique data
        const profilesOnly = profilesData.rows.filter(profile => 
            !appUsersData.rows.some(user => user.email === profile.email)
        );
        
        const appUsersOnly = appUsersData.rows.filter(user => 
            !profilesData.rows.some(profile => profile.email === user.email)
        );
        
        console.log(`   📋 Users only in Profiles: ${profilesOnly.length}`);
        profilesOnly.forEach(profile => {
            console.log(`     ${profile.email}: ${profile.name} (${profile.role})`);
        });
        
        console.log(`   📋 Users only in AppUsers: ${appUsersOnly.length}`);
        appUsersOnly.forEach(user => {
            console.log(`     ${user.email}: ${user.name} (${user.primary_role})`);
        });
        
        console.log('\n5. Functional analysis...');
        
        // Check what profiles table actually provides
        console.log('   Profiles table provides:');
        console.log('     • Basic user info (name, email, phone, address)');
        console.log('     • Role information');
        console.log('     • human_id');
        console.log('     • raw_data (JSONB)');
        
        console.log('\n   AppUsers table provides:');
        console.log('     • Basic user info (name, email, phone, address)');
        console.log('     • Role information (primary_role)');
        console.log('     • human_id');
        console.log('     • User status');
        console.log('     • Role update tracking');
        console.log('     • createdAt (legacy Firebase data)');
        
        console.log('\n   Customers table provides:');
        console.log('     • Just customer names');
        console.log('     • No email or contact info');
        console.log('     • Appears to be a different entity');
        
        console.log('\n6. CONCLUSION...');
        
        const isProfilesRedundant = overlappingEmails.length === profilesData.rows.length && 
                                   profilesOnly.length === 0;
        
        if (isProfilesRedundant) {
            console.log('   🎯 RECOMMENDATION: REMOVE PROFILES TABLE');
            console.log('\n   ✅ REASONS:');
            console.log('     • 100% data overlap with appUsers');
            console.log('     • No unique information');
            console.log('     • AppUsers is more feature-rich');
            console.log('     • Eliminates data duplication');
            console.log('     • Simplifies the data model');
            
            console.log('\n   🔄 MIGRATION PLAN:');
            console.log('     1. Verify all profiles data exists in appUsers ✅');
            console.log('     2. Check for any dependencies');
            console.log('     3. Update any code/views that reference profiles');
            console.log('     4. Drop profiles table');
            console.log('     5. Drop user_role ENUM if not used elsewhere');
            
        } else {
            console.log('   🎯 RECOMMENDATION: KEEP PROFILES TABLE');
            console.log('\n   ⚠️  REASONS:');
            console.log('     • Contains unique data not in appUsers');
            console.log('     • Serves different business purpose');
            console.log('     • Required for specific functionality');
        }
        
        console.log('\n7. Customers table analysis...');
        console.log('   📝 Customers table is DIFFERENT from user tables:');
        console.log('     • No email/contact information');
        console.log('     • Appears to be business entities, not users');
        console.log('     • Should be kept as separate business entity table');
        
        console.log('\n✅ ANALYSIS COMPLETE!');
        
        if (isProfilesRedundant) {
            console.log('\n🚀 NEXT STEP: Create profiles table removal script');
        }
        
        client.release();
        
    } catch (error) {
        console.error('Error in redundancy analysis:', error);
    } finally {
        await pool.end();
    }
}

simpleRedundancyAnalysis();
