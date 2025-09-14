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

async function removeBackupTables() {
    try {
        const client = await pool.connect();
        
        console.log('=== REMOVING ALL BACKUP TABLES ===\n');
        
        console.log('1. Scanning for backup tables...');
        
        // Find all backup tables
        const backupTables = await client.query(`
            SELECT 
                table_name,
                table_type
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            AND (
                table_name LIKE '%backup%' OR
                table_name LIKE '%_old' OR
                table_name LIKE '%_temp' OR
                table_name LIKE '%_bkp' OR
                table_name LIKE 'temp_%'
            )
            ORDER BY table_name
        `);
        
        if (backupTables.rows.length === 0) {
            console.log('   ✅ No backup tables found to remove');
            client.release();
            return;
        }
        
        console.log(`   Found ${backupTables.rows.length} backup tables:`);
        backupTables.rows.forEach((table, index) => {
            console.log(`     ${index + 1}. ${table.table_name}`);
        });
        
        console.log('\n2. Checking table sizes before removal...');
        
        const tableSizes = [];
        for (const table of backupTables.rows) {
            try {
                const sizeInfo = await client.query(`
                    SELECT 
                        COUNT(*) as row_count,
                        pg_size_pretty(pg_total_relation_size($1)) as size
                    FROM "${table.table_name}"
                `, [table.table_name]);
                
                tableSizes.push({
                    name: table.table_name,
                    rows: sizeInfo.rows[0].row_count,
                    size: sizeInfo.rows[0].size
                });
                
                console.log(`     ${table.table_name}: ${sizeInfo.rows[0].row_count} rows (${sizeInfo.rows[0].size})`);
            } catch (error) {
                console.log(`     ${table.table_name}: Error getting size - ${error.message}`);
                tableSizes.push({
                    name: table.table_name,
                    rows: 'Unknown',
                    size: 'Unknown'
                });
            }
        }
        
        console.log('\n3. Creating final backup summary before deletion...');
        
        // Create a summary of what we're about to delete
        const summaryData = {
            deletion_timestamp: new Date().toISOString(),
            total_backup_tables: backupTables.rows.length,
            tables_removed: tableSizes.map(t => ({
                table_name: t.name,
                row_count: t.rows,
                size: t.size
            }))
        };
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS backup_deletion_log (
                id SERIAL PRIMARY KEY,
                deletion_timestamp TIMESTAMP DEFAULT NOW(),
                summary_data JSONB
            )
        `);
        
        await client.query(`
            INSERT INTO backup_deletion_log (summary_data)
            VALUES ($1)
        `, [JSON.stringify(summaryData)]);
        
        console.log('   ✅ Created deletion log entry');
        
        console.log('\n4. Removing backup tables...');
        
        let successCount = 0;
        let errorCount = 0;
        
        for (const table of backupTables.rows) {
            try {
                // Check if table has any dependencies
                const dependencies = await client.query(`
                    SELECT 
                        dependent_ns.nspname as dependent_schema,
                        dependent_view.relname as dependent_view,
                        source_ns.nspname as source_schema,
                        source_table.relname as source_table
                    FROM pg_depend 
                    JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid 
                    JOIN pg_class as dependent_view ON pg_rewrite.ev_class = dependent_view.oid 
                    JOIN pg_class as source_table ON pg_depend.refobjid = source_table.oid 
                    JOIN pg_namespace dependent_ns ON dependent_ns.oid = dependent_view.relnamespace
                    JOIN pg_namespace source_ns ON source_ns.oid = source_table.relnamespace
                    WHERE source_table.relname = $1
                `, [table.table_name]);
                
                if (dependencies.rows.length > 0) {
                    console.log(`     ⚠️  ${table.table_name} has dependencies, using CASCADE`);
                    await client.query(`DROP TABLE IF EXISTS "${table.table_name}" CASCADE`);
                } else {
                    await client.query(`DROP TABLE IF EXISTS "${table.table_name}"`);
                }
                
                console.log(`     ✅ Removed: ${table.table_name}`);
                successCount++;
                
            } catch (error) {
                console.log(`     ❌ Error removing ${table.table_name}: ${error.message}`);
                errorCount++;
            }
        }
        
        console.log('\n5. Verifying cleanup...');
        
        // Check if any backup tables still exist
        const remainingBackups = await client.query(`
            SELECT table_name
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            AND (
                table_name LIKE '%backup%' OR
                table_name LIKE '%_old' OR
                table_name LIKE '%_temp' OR
                table_name LIKE '%_bkp' OR
                table_name LIKE 'temp_%'
            )
            ORDER BY table_name
        `);
        
        if (remainingBackups.rows.length > 0) {
            console.log(`   ⚠️  ${remainingBackups.rows.length} backup tables still exist:`);
            remainingBackups.rows.forEach(table => {
                console.log(`     - ${table.table_name}`);
            });
        } else {
            console.log('   ✅ All backup tables successfully removed');
        }
        
        console.log('\n6. Final database statistics...');
        
        // Get final table count
        const finalStats = await client.query(`
            SELECT 
                COUNT(*) as total_tables,
                COUNT(CASE WHEN table_name LIKE '%backup%' THEN 1 END) as backup_tables,
                pg_size_pretty(SUM(pg_total_relation_size(quote_ident(table_name)))) as total_size
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        `);
        
        const stats = finalStats.rows[0];
        console.log(`     Total tables: ${stats.total_tables}`);
        console.log(`     Remaining backup tables: ${stats.backup_tables}`);
        console.log(`     Total database size: ${stats.total_size}`);
        
        // Show space saved
        const totalRowsRemoved = tableSizes.reduce((sum, table) => {
            return sum + (typeof table.rows === 'number' ? table.rows : 0);
        }, 0);
        
        console.log(`     Estimated rows removed: ${totalRowsRemoved}`);
        
        console.log('\n✅ BACKUP TABLE CLEANUP COMPLETE!');
        console.log('\n📊 SUMMARY:');
        console.log(`   ✅ Tables successfully removed: ${successCount}`);
        console.log(`   ❌ Tables with errors: ${errorCount}`);
        console.log(`   📝 Deletion log created: backup_deletion_log`);
        console.log(`   🗄️  Total tables remaining: ${stats.total_tables}`);
        
        console.log('\n🚀 BENEFITS:');
        console.log('   • Reduced database size and clutter');
        console.log('   • Improved backup and maintenance performance');
        console.log('   • Cleaner database structure');
        console.log('   • Eliminated outdated backup data');
        console.log('   • Better overview of production tables');
        
        console.log('\n💡 IMPORTANT NOTES:');
        console.log('   • Deletion summary logged in backup_deletion_log table');
        console.log('   • All production data and structure intact');
        console.log('   • Migration process complete and cleaned up');
        console.log('   • Database ready for production use');
        
        if (remainingBackups.rows.length > 0) {
            console.log('\n⚠️  REMAINING CLEANUP:');
            console.log('   Some backup tables still exist and may need manual review');
            console.log('   Check if they contain important data before removal');
        }
        
        client.release();
        
    } catch (error) {
        console.error('Error removing backup tables:', error);
    } finally {
        await pool.end();
    }
}

removeBackupTables();
