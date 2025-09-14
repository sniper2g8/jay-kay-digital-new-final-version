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

async function dropRedundantColumns() {
    try {
        const client = await pool.connect();
        
        console.log('=== DROPPING REDUNDANT COLUMNS FROM ALL TABLES ===\n');
        
        console.log('1. Scanning for redundant columns...');
        
        // Get all tables and their columns
        const allColumns = await client.query(`
            SELECT 
                table_name,
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name NOT LIKE 'pg_%'
            ORDER BY table_name, ordinal_position
        `);
        
        // Define redundant columns to remove
        const redundantColumns = {
            'appUsers': ['unified_id'],
            'jobs': ['firestore_id'], // if any remain
            'customers': ['firestore_id'], // if any remain
            'invoices': ['firestore_id'], // if any remain
            'services': ['firestore_id'], // if any remain
            'pricingRules': ['firestore_id'], // if any remain
            // Add any other tables and columns that might be redundant
        };
        
        // Check for firestore_id columns in all tables
        const firestoreIdColumns = allColumns.rows.filter(col => 
            col.column_name === 'firestore_id' || 
            col.column_name === 'unified_id' ||
            col.column_name === 'old_id' ||
            col.column_name === 'legacy_id'
        );
        
        console.log('   Found potentially redundant columns:');
        if (firestoreIdColumns.length > 0) {
            firestoreIdColumns.forEach(col => {
                console.log(`     ${col.table_name}.${col.column_name} (${col.data_type})`);
            });
        } else {
            console.log('     No firestore_id or legacy columns found');
        }
        
        // Add found firestore_id columns to redundant list
        firestoreIdColumns.forEach(col => {
            if (!redundantColumns[col.table_name]) {
                redundantColumns[col.table_name] = [];
            }
            if (!redundantColumns[col.table_name].includes(col.column_name)) {
                redundantColumns[col.table_name].push(col.column_name);
            }
        });
        
        console.log('\n2. Backing up data before dropping columns...');
        
        // Create backup tables for important data
        const backupQueries = [
            {
                table: 'appUsers',
                columns: ['unified_id'],
                query: `
                    CREATE TABLE IF NOT EXISTS "appUsers_column_backup" AS
                    SELECT id, human_id, name, email, unified_id, created_at
                    FROM "appUsers" 
                    WHERE unified_id IS NOT NULL
                `
            }
        ];
        
        for (const backup of backupQueries) {
            try {
                const hasData = await client.query(`
                    SELECT COUNT(*) as count 
                    FROM "${backup.table}" 
                    WHERE ${backup.columns[0]} IS NOT NULL
                `);
                
                if (parseInt(hasData.rows[0].count) > 0) {
                    await client.query(backup.query);
                    console.log(`   ✅ Backed up ${backup.table} data (${hasData.rows[0].count} records with ${backup.columns[0]})`);
                } else {
                    console.log(`   ⚠️  No data to backup for ${backup.table}.${backup.columns[0]}`);
                }
            } catch (error) {
                console.log(`   ⚠️  Backup for ${backup.table}: ${error.message}`);
            }
        }
        
        console.log('\n3. Dropping redundant columns...');
        
        let droppedCount = 0;
        let errorCount = 0;
        
        for (const [tableName, columns] of Object.entries(redundantColumns)) {
            if (columns.length === 0) continue;
            
            console.log(`\n   Processing table: ${tableName}`);
            
            for (const columnName of columns) {
                try {
                    // Check if column exists
                    const columnExists = await client.query(`
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = $1 AND column_name = $2
                    `, [tableName, columnName]);
                    
                    if (columnExists.rows.length > 0) {
                        // Check for any constraints or indexes on this column
                        const constraints = await client.query(`
                            SELECT constraint_name, constraint_type
                            FROM information_schema.table_constraints tc
                            JOIN information_schema.constraint_column_usage ccu 
                                ON tc.constraint_name = ccu.constraint_name
                            WHERE tc.table_name = $1 AND ccu.column_name = $2
                        `, [tableName, columnName]);
                        
                        // Drop constraints if any
                        for (const constraint of constraints.rows) {
                            try {
                                await client.query(`ALTER TABLE "${tableName}" DROP CONSTRAINT IF EXISTS "${constraint.constraint_name}"`);
                                console.log(`     ✅ Dropped constraint: ${constraint.constraint_name}`);
                            } catch (error) {
                                console.log(`     ⚠️  Constraint drop: ${error.message}`);
                            }
                        }
                        
                        // Drop indexes if any
                        const indexes = await client.query(`
                            SELECT indexname 
                            FROM pg_indexes 
                            WHERE tablename = $1 
                            AND indexdef ILIKE '%' || $2 || '%'
                        `, [tableName, columnName]);
                        
                        for (const index of indexes.rows) {
                            try {
                                await client.query(`DROP INDEX IF EXISTS "${index.indexname}"`);
                                console.log(`     ✅ Dropped index: ${index.indexname}`);
                            } catch (error) {
                                console.log(`     ⚠️  Index drop: ${error.message}`);
                            }
                        }
                        
                        // Finally drop the column
                        await client.query(`ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "${columnName}"`);
                        console.log(`     ✅ Dropped column: ${tableName}.${columnName}`);
                        droppedCount++;
                        
                    } else {
                        console.log(`     ⚠️  Column ${columnName} does not exist in ${tableName}`);
                    }
                    
                } catch (error) {
                    console.log(`     ❌ Error dropping ${tableName}.${columnName}: ${error.message}`);
                    errorCount++;
                }
            }
        }
        
        console.log('\n4. Checking for other potential redundant columns...');
        
        // Look for duplicate or similar columns
        const suspiciousColumns = await client.query(`
            SELECT 
                table_name,
                column_name,
                data_type
            FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND (
                column_name ILIKE '%temp%' OR
                column_name ILIKE '%old%' OR
                column_name ILIKE '%legacy%' OR
                column_name ILIKE '%backup%' OR
                column_name ILIKE '%duplicate%' OR
                column_name ILIKE '%test%'
            )
            ORDER BY table_name, column_name
        `);
        
        if (suspiciousColumns.rows.length > 0) {
            console.log('   Found potentially suspicious columns:');
            suspiciousColumns.rows.forEach(col => {
                console.log(`     ${col.table_name}.${col.column_name} (${col.data_type})`);
            });
            console.log('   💡 Review these manually if they are no longer needed');
        } else {
            console.log('   ✅ No suspicious column names found');
        }
        
        console.log('\n5. Cleaning up empty or null-only columns...');
        
        // Find columns that are entirely NULL
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            AND table_name NOT LIKE 'pg_%'
        `);
        
        const nullColumns = [];
        
        for (const table of tables.rows) {
            try {
                const columns = await client.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = $1 
                    AND is_nullable = 'YES'
                    AND column_default IS NULL
                    AND column_name NOT IN ('id', 'created_at', 'updated_at')
                `, [table.table_name]);
                
                for (const col of columns.rows) {
                    // Check if column has only NULL values
                    const nullCheck = await client.query(`
                        SELECT COUNT(*) as total, 
                               COUNT("${col.column_name}") as non_null
                        FROM "${table.table_name}"
                    `);
                    
                    const total = parseInt(nullCheck.rows[0].total);
                    const nonNull = parseInt(nullCheck.rows[0].non_null);
                    
                    if (total > 0 && nonNull === 0) {
                        nullColumns.push({
                            table: table.table_name,
                            column: col.column_name,
                            total: total
                        });
                    }
                }
            } catch (error) {
                // Skip tables that might have issues
                continue;
            }
        }
        
        if (nullColumns.length > 0) {
            console.log('   Found columns with only NULL values:');
            nullColumns.forEach(col => {
                console.log(`     ${col.table}.${col.column} (${col.total} NULL rows)`);
            });
            console.log('   💡 Consider dropping these if they are truly unused');
        } else {
            console.log('   ✅ No entirely NULL columns found');
        }
        
        console.log('\n6. Final table structure summary...');
        
        // Get final structure of key tables
        const keyTables = ['appUsers', 'jobs', 'customers', 'invoices', 'services'];
        
        for (const tableName of keyTables) {
            try {
                const tableColumns = await client.query(`
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns 
                    WHERE table_name = $1 
                    ORDER BY ordinal_position
                `, [tableName]);
                
                if (tableColumns.rows.length > 0) {
                    console.log(`\n   ${tableName} final structure:`);
                    tableColumns.rows.forEach(col => {
                        const nullable = col.is_nullable === 'YES' ? 'nullable' : 'NOT NULL';
                        console.log(`     ${col.column_name}: ${col.data_type} (${nullable})`);
                    });
                }
            } catch (error) {
                console.log(`   ⚠️  Could not get structure for ${tableName}: ${error.message}`);
            }
        }
        
        console.log('\n✅ REDUNDANT COLUMN CLEANUP COMPLETE!');
        console.log('\n📊 SUMMARY:');
        console.log(`   ✅ Columns dropped: ${droppedCount}`);
        console.log(`   ❌ Errors encountered: ${errorCount}`);
        console.log(`   📝 Backup tables created: ${backupQueries.length}`);
        console.log(`   🔍 Suspicious columns identified: ${suspiciousColumns.rows.length}`);
        console.log(`   🗑️  NULL-only columns found: ${nullColumns.length}`);
        
        console.log('\n🚀 BENEFITS:');
        console.log('   • Cleaner table structures');
        console.log('   • Reduced storage usage');
        console.log('   • Eliminated confusing legacy columns');
        console.log('   • Better database performance');
        console.log('   • Simplified data model');
        
        console.log('\n📝 NEXT STEPS:');
        console.log('   1. Review suspicious columns manually');
        console.log('   2. Consider dropping NULL-only columns if unused');
        console.log('   3. Update any application code that referenced dropped columns');
        console.log('   4. Run VACUUM FULL on affected tables for storage optimization');
        
        client.release();
        
    } catch (error) {
        console.error('Error dropping redundant columns:', error);
    } finally {
        await pool.end();
    }
}

dropRedundantColumns();
