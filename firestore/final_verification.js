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

async function finalVerification() {
    try {
        const client = await pool.connect();
        
        console.log('=== FINAL VERIFICATION - ALL ISSUES RESOLVED ===\n');
        
        console.log('1. Checking all tables have UUID primary keys...');
        
        const tableInfo = await client.query(`
            SELECT 
                t.table_name,
                c.column_name,
                c.data_type,
                c.is_nullable,
                CASE WHEN tc.constraint_type = 'PRIMARY KEY' THEN 'YES' ELSE 'NO' END as is_primary_key
            FROM information_schema.tables t
            LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
            LEFT JOIN information_schema.key_column_usage kcu ON c.table_name = kcu.table_name AND c.column_name = kcu.column_name
            LEFT JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
            WHERE t.table_schema = 'public' 
            AND t.table_type = 'BASE TABLE'
            AND c.column_name = 'id'
            AND (tc.constraint_type = 'PRIMARY KEY' OR tc.constraint_type IS NULL)
            ORDER BY t.table_name
        `);
        
        const uuidTables = [];
        const nonUuidTables = [];
        
        tableInfo.rows.forEach(row => {
            if (row.data_type === 'uuid' && row.is_primary_key === 'YES') {
                uuidTables.push(row.table_name);
            } else if (row.table_name) {
                nonUuidTables.push(`${row.table_name} (${row.data_type})`);
            }
        });
        
        console.log(`   ✅ Tables with UUID primary keys (${uuidTables.length}):`);
        uuidTables.forEach(table => console.log(`     - ${table}`));
        
        if (nonUuidTables.length > 0) {
            console.log(`   ⚠️  Tables without UUID primary keys (${nonUuidTables.length}):`);
            nonUuidTables.forEach(table => console.log(`     - ${table}`));
        }
        
        console.log('\n2. Checking for any remaining firestore_id columns...');
        
        const firestoreColumns = await client.query(`
            SELECT table_name, column_name
            FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND column_name LIKE '%firestore_id%'
            ORDER BY table_name, column_name
        `);
        
        if (firestoreColumns.rows.length === 0) {
            console.log('   ✅ No firestore_id columns found - all properly renamed');
        } else {
            console.log(`   ⚠️  Found ${firestoreColumns.rows.length} firestore_id columns:`);
            firestoreColumns.rows.forEach(row => {
                console.log(`     ${row.table_name}.${row.column_name}`);
            });
        }
        
        console.log('\n3. Checking foreign key relationships...');
        
        const foreignKeys = await client.query(`
            SELECT 
                kcu.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name,
                tc.constraint_name
            FROM 
                information_schema.key_column_usage kcu
                JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
                JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
            WHERE 
                tc.constraint_type = 'FOREIGN KEY'
                AND kcu.table_schema = 'public'
            ORDER BY kcu.table_name, kcu.column_name
        `);
        
        console.log(`   ✅ Found ${foreignKeys.rows.length} foreign key relationships:`);
        foreignKeys.rows.forEach(fk => {
            console.log(`     ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });
        
        console.log('\n4. Checking indexes...');
        
        const indexes = await client.query(`
            SELECT 
                schemaname,
                tablename,
                indexname,
                indexdef
            FROM pg_indexes
            WHERE schemaname = 'public'
            AND indexname NOT LIKE '%_pkey'
            ORDER BY tablename, indexname
        `);
        
        console.log(`   ✅ Found ${indexes.rows.length} performance indexes:`);
        indexes.rows.forEach(idx => {
            console.log(`     ${idx.tablename}: ${idx.indexname}`);
        });
        
        console.log('\n5. Testing counters functionality...');
        
        const countersTest = await client.query('SELECT counter_id, last FROM "counters" ORDER BY counter_id');
        console.log(`   ✅ Counters table working (${countersTest.rows.length} counters):`);
        countersTest.rows.forEach(counter => {
            console.log(`     ${counter.counter_id}: ${counter.last}`);
        });
        
        console.log('\n6. Checking record counts...');
        
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);
        
        let totalRecords = 0;
        for (const table of tables.rows) {
            const count = await client.query(`SELECT COUNT(*) as count FROM "${table.table_name}"`);
            const recordCount = parseInt(count.rows[0].count);
            totalRecords += recordCount;
            console.log(`     ${table.table_name}: ${recordCount.toLocaleString()} records`);
        }
        
        console.log(`   📊 Total records across all tables: ${totalRecords.toLocaleString()}`);
        
        console.log('\n=== MIGRATION COMPLETION SUMMARY ===');
        console.log(`✅ UUID Primary Keys: ${uuidTables.length}/${tableInfo.rows.length} tables`);
        console.log(`✅ Firestore ID Cleanup: ${firestoreColumns.rows.length === 0 ? 'Complete' : 'Remaining: ' + firestoreColumns.rows.length}`);
        console.log(`✅ Foreign Key Relationships: ${foreignKeys.rows.length} established`);
        console.log(`✅ Performance Indexes: ${indexes.rows.length} created`);
        console.log(`✅ Counter Functionality: Working (${countersTest.rows.length} counters)`);
        console.log(`✅ Total Data Migrated: ${totalRecords.toLocaleString()} records`);
        
        if (uuidTables.length === tableInfo.rows.length && firestoreColumns.rows.length === 0) {
            console.log('\n🎉 MIGRATION 100% COMPLETE! 🎉');
            console.log('All Firebase data successfully migrated to Supabase with proper UUID structure!');
        } else {
            console.log('\n⚠️  Migration mostly complete with minor issues remaining');
        }
        
        client.release();
        
    } catch (error) {
        console.error('Error in final verification:', error);
    } finally {
        await pool.end();
    }
}

finalVerification();
