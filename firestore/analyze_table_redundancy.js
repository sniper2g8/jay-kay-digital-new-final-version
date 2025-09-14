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

async function analyzeTableRedundancy() {
    try {
        const client = await pool.connect();
        
        console.log('=== ANALYZING TABLE REDUNDANCY: PROFILES vs APPUSERS vs CUSTOMERS ===\n');
        
        console.log('1. Analyzing table structures...');
        
        // Get structure of each table
        const tables = ['profiles', 'appUsers', 'customers'];
        const tableStructures = {};
        
        for (const tableName of tables) {
            try {
                const structure = await client.query(`
                    SELECT 
                        column_name,
                        data_type,
                        is_nullable,
                        column_default
                    FROM information_schema.columns 
                    WHERE table_name = $1
                    ORDER BY ordinal_position
                `, [tableName]);
                
                tableStructures[tableName] = structure.rows;
                console.log(`\n   📊 ${tableName} structure (${structure.rows.length} columns):`);
                structure.rows.forEach(col => {
                    console.log(`     ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'NOT NULL'})`);
                });
            } catch (error) {
                console.log(`   ❌ Error getting ${tableName} structure: ${error.message}`);
            }
        }
        
        console.log('\n2. Comparing data overlap...');
        
        // Check data overlap between tables
        const dataComparison = await client.query(`
            SELECT 
                'profiles' as source_table,
                COUNT(*) as total_records,
                COUNT(DISTINCT email) as unique_emails,
                COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as records_with_email
            FROM profiles
            
            UNION ALL
            
            SELECT 
                'appUsers' as source_table,
                COUNT(*) as total_records,
                COUNT(DISTINCT email) as unique_emails,
                COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as records_with_email
            FROM "appUsers"
            
            UNION ALL
            
            SELECT 
                'customers' as source_table,
                COUNT(*) as total_records,
                COUNT(DISTINCT email) as unique_emails,
                COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as records_with_email
            FROM customers
        `);
        
        console.log('   📊 Data comparison:');
        dataComparison.rows.forEach(row => {
            console.log(`     ${row.source_table}: ${row.total_records} records, ${row.unique_emails} unique emails`);
        });
        
        console.log('\n3. Finding email overlaps...');
        
        // Check which emails exist in multiple tables
        const emailOverlaps = await client.query(`
            WITH email_sources AS (
                SELECT email, 'profiles' as source FROM profiles WHERE email IS NOT NULL
                UNION ALL
                SELECT email, 'appUsers' as source FROM "appUsers" WHERE email IS NOT NULL
                UNION ALL
                SELECT email, 'customers' as source FROM customers WHERE email IS NOT NULL
            ),
            email_counts AS (
                SELECT 
                    email,
                    COUNT(*) as table_count,
                    string_agg(source, ', ') as found_in_tables
                FROM email_sources
                GROUP BY email
            )
            SELECT 
                table_count,
                COUNT(*) as email_count,
                string_agg(email, ', ') as sample_emails
            FROM email_counts
            GROUP BY table_count
            ORDER BY table_count DESC
        `);
        
        console.log('   📊 Email overlap analysis:');
        emailOverlaps.rows.forEach(overlap => {
            console.log(`     ${overlap.email_count} emails exist in ${overlap.table_count} table(s)`);
            if (overlap.table_count > 1) {
                console.log(`       Sample: ${overlap.sample_emails}`);
            }
        });
        
        console.log('\n4. Detailed overlap investigation...');
        
        // Show specific overlapping records
        const detailedOverlap = await client.query(`
            SELECT 
                COALESCE(p.email, au.email, c.email) as email,
                p.name as profile_name,
                p.role as profile_role,
                au.name as appuser_name,
                au.primary_role as appuser_role,
                c.name as customer_name,
                c.type as customer_type
            FROM profiles p
            FULL OUTER JOIN "appUsers" au ON p.email = au.email
            FULL OUTER JOIN customers c ON COALESCE(p.email, au.email) = c.email
            WHERE COALESCE(p.email, au.email, c.email) IS NOT NULL
            ORDER BY COALESCE(p.email, au.email, c.email)
        `);
        
        console.log(`   📋 Detailed record comparison (${detailedOverlap.rows.length} unique emails):`);
        detailedOverlap.rows.forEach(record => {
            console.log(`\n     📧 ${record.email}:`);
            if (record.profile_name) {
                console.log(`       Profiles: ${record.profile_name} (${record.profile_role})`);
            }
            if (record.appuser_name) {
                console.log(`       AppUsers: ${record.appuser_name} (${record.appuser_role})`);
            }
            if (record.customer_name) {
                console.log(`       Customers: ${record.customer_name} (${record.customer_type})`);
            }
        });
        
        console.log('\n5. Analyzing unique value propositions...');
        
        // Check what unique data each table provides
        const uniqueAnalysis = {
            profiles: [],
            appUsers: [],
            customers: []
        };
        
        // Profiles unique features
        if (tableStructures.profiles) {
            const profileColumns = tableStructures.profiles.map(col => col.column_name);
            const appUserColumns = tableStructures.appUsers ? tableStructures.appUsers.map(col => col.column_name) : [];
            const customerColumns = tableStructures.customers ? tableStructures.customers.map(col => col.column_name) : [];
            
            uniqueAnalysis.profiles = profileColumns.filter(col => 
                !appUserColumns.includes(col) && !customerColumns.includes(col) && 
                !['id', 'created_at', 'updated_at'].includes(col)
            );
        }
        
        // AppUsers unique features
        if (tableStructures.appUsers) {
            const appUserColumns = tableStructures.appUsers.map(col => col.column_name);
            const profileColumns = tableStructures.profiles ? tableStructures.profiles.map(col => col.column_name) : [];
            const customerColumns = tableStructures.customers ? tableStructures.customers.map(col => col.column_name) : [];
            
            uniqueAnalysis.appUsers = appUserColumns.filter(col => 
                !profileColumns.includes(col) && !customerColumns.includes(col) && 
                !['id', 'created_at', 'updated_at'].includes(col)
            );
        }
        
        // Customers unique features
        if (tableStructures.customers) {
            const customerColumns = tableStructures.customers.map(col => col.column_name);
            const profileColumns = tableStructures.profiles ? tableStructures.profiles.map(col => col.column_name) : [];
            const appUserColumns = tableStructures.appUsers ? tableStructures.appUsers.map(col => col.column_name) : [];
            
            uniqueAnalysis.customers = customerColumns.filter(col => 
                !profileColumns.includes(col) && !appUserColumns.includes(col) && 
                !['id', 'created_at', 'updated_at'].includes(col)
            );
        }
        
        console.log('   🔍 Unique value analysis:');
        Object.keys(uniqueAnalysis).forEach(table => {
            console.log(`     ${table} unique columns: ${uniqueAnalysis[table].join(', ') || 'None'}`);
        });
        
        console.log('\n6. Usage and relationship analysis...');
        
        // Check how profiles table is referenced
        const profileReferences = await client.query(`
            SELECT 
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND (ccu.table_name = 'profiles' OR tc.table_name = 'profiles')
        `);
        
        console.log(`   🔗 Profiles table references (${profileReferences.rows.length}):`);
        if (profileReferences.rows.length > 0) {
            profileReferences.rows.forEach(ref => {
                console.log(`     ${ref.table_name}.${ref.column_name} → ${ref.foreign_table_name}.${ref.foreign_column_name}`);
            });
        } else {
            console.log('     No foreign key references found');
        }
        
        console.log('\n7. Recommendation analysis...');
        
        // Determine if profiles table is redundant
        const isRedundant = uniqueAnalysis.profiles.length === 0 || 
                           (uniqueAnalysis.profiles.length === 1 && uniqueAnalysis.profiles[0] === 'raw_data');
        
        console.log(`   📝 Analysis Summary:`);
        console.log(`     Profiles table appears ${isRedundant ? 'REDUNDANT' : 'NECESSARY'}`);
        
        if (isRedundant) {
            console.log(`\n   💡 RECOMMENDATION: REMOVE PROFILES TABLE`);
            console.log(`     Reasons:`);
            console.log(`     • AppUsers table covers user management with roles`);
            console.log(`     • Customers table covers customer-specific data`);
            console.log(`     • Profiles adds no unique value`);
            console.log(`     • Eliminates data duplication`);
            console.log(`     • Simplifies data model`);
            
            console.log(`\n   🔄 MIGRATION STRATEGY:`);
            console.log(`     1. Verify all profiles data exists in appUsers`);
            console.log(`     2. Migrate any unique data to appropriate table`);
            console.log(`     3. Update any dependent code/views`);
            console.log(`     4. Drop profiles table`);
            console.log(`     5. Clean up unused ENUM types`);
            
        } else {
            console.log(`\n   💡 RECOMMENDATION: KEEP PROFILES TABLE`);
            console.log(`     Reasons:`);
            console.log(`     • Contains unique data: ${uniqueAnalysis.profiles.join(', ')}`);
            console.log(`     • Serves specific business purpose`);
            console.log(`     • Referenced by other tables`);
        }
        
        console.log('\n8. Data migration preview (if removing profiles)...');
        
        if (isRedundant) {
            // Show what would happen to the data
            const migrationPreview = await client.query(`
                SELECT 
                    p.email,
                    p.name as profile_name,
                    au.name as appuser_name,
                    CASE 
                        WHEN au.email IS NULL THEN 'WOULD CREATE NEW APPUSER'
                        WHEN p.name != au.name THEN 'NAME CONFLICT'
                        ELSE 'NO ACTION NEEDED'
                    END as migration_action
                FROM profiles p
                LEFT JOIN "appUsers" au ON p.email = au.email
            `);
            
            console.log(`   📋 Migration preview:`);
            migrationPreview.rows.forEach(preview => {
                console.log(`     ${preview.email}: ${preview.migration_action}`);
            });
        }
        
        console.log('\n✅ TABLE REDUNDANCY ANALYSIS COMPLETE!');
        
        if (isRedundant) {
            console.log('\n🎯 NEXT STEPS TO REMOVE PROFILES TABLE:');
            console.log('   1. Create removal script');
            console.log('   2. Migrate any missing data');
            console.log('   3. Update dependent objects');
            console.log('   4. Drop profiles table');
            console.log('   5. Simplify database schema');
        }
        
        client.release();
        
    } catch (error) {
        console.error('Error analyzing table redundancy:', error);
    } finally {
        await pool.end();
    }
}

analyzeTableRedundancy();
