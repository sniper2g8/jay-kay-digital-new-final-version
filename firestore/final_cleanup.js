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

async function finalCleanup() {
    try {
        const client = await pool.connect();
        
        console.log('=== FINAL CLEANUP - COMPLETING 100% MIGRATION ===\n');
        
        console.log('1. Checking for remaining tables without UUID primary keys...');
        
        // Get all tables and their primary key info
        const allTables = await client.query(`
            SELECT DISTINCT t.table_name,
                   STRING_AGG(kcu.column_name, ', ') as pk_columns,
                   STRING_AGG(c.data_type, ', ') as pk_types
            FROM information_schema.tables t
            LEFT JOIN information_schema.table_constraints tc 
                ON t.table_name = tc.table_name 
                AND tc.constraint_type = 'PRIMARY KEY'
            LEFT JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            LEFT JOIN information_schema.columns c 
                ON kcu.table_name = c.table_name 
                AND kcu.column_name = c.column_name
            WHERE t.table_schema = 'public' 
                AND t.table_type = 'BASE TABLE'
                AND t.table_name NOT LIKE 'pg_%'
                AND t.table_name NOT LIKE 'sql_%'
            GROUP BY t.table_name
            ORDER BY t.table_name
        `);
        
        console.log('Current table status:');
        allTables.rows.forEach(table => {
            const hasUuidPk = table.pk_types && table.pk_types.includes('uuid');
            const status = hasUuidPk ? '✅' : '❌';
            console.log(`   ${status} ${table.table_name}: PK(${table.pk_columns || 'none'}) - ${table.pk_types || 'no primary key'}`);
        });
        
        console.log('\n2. Fixing notification_preferences table...');
        
        const notifPrefsExists = allTables.rows.find(t => t.table_name === 'notification_preferences');
        if (notifPrefsExists) {
            if (!notifPrefsExists.pk_types || !notifPrefsExists.pk_types.includes('uuid')) {
                console.log('   Adding UUID primary key to notification_preferences...');
                
                // Temporarily disable triggers
                await client.query('SET session_replication_role = replica;');
                
                try {
                    // Add UUID column if it doesn't exist
                    await client.query('ALTER TABLE "notification_preferences" ADD COLUMN id UUID DEFAULT gen_random_uuid()');
                    console.log('     ✅ Added UUID id column');
                } catch (error) {
                    if (error.message.includes('already exists')) {
                        console.log('     ⚠️  UUID id column already exists');
                    }
                }
                
                // Update any NULL UUIDs
                await client.query('UPDATE "notification_preferences" SET id = gen_random_uuid() WHERE id IS NULL');
                
                // Set as primary key
                try {
                    await client.query('ALTER TABLE "notification_preferences" ADD PRIMARY KEY (id)');
                    console.log('     ✅ Set UUID primary key');
                } catch (error) {
                    console.log(`     ⚠️  Primary key: ${error.message}`);
                }
                
                // Re-enable triggers
                await client.query('SET session_replication_role = DEFAULT;');
            } else {
                console.log('   ✅ notification_preferences already has UUID primary key');
            }
        } else {
            console.log('   ℹ️  notification_preferences table not found');
        }
        
        console.log('\n3. Fixing pricingRules table primary key...');
        
        const pricingRulesTable = allTables.rows.find(t => t.table_name === 'pricingRules');
        if (pricingRulesTable && (!pricingRulesTable.pk_types || !pricingRulesTable.pk_types.includes('uuid'))) {
            try {
                await client.query('ALTER TABLE "pricingRules" ADD PRIMARY KEY (id)');
                console.log('   ✅ Set UUID primary key for pricingRules');
            } catch (error) {
                console.log(`   ⚠️  pricingRules primary key: ${error.message}`);
            }
        } else {
            console.log('   ✅ pricingRules already has proper primary key');
        }
        
        console.log('\n4. Fixing invoice_payments primary key...');
        
        const invoicePaymentsTable = allTables.rows.find(t => t.table_name === 'invoice_payments');
        if (invoicePaymentsTable && (!invoicePaymentsTable.pk_types || !invoicePaymentsTable.pk_types.includes('uuid'))) {
            try {
                await client.query('ALTER TABLE "invoice_payments" ADD PRIMARY KEY (id)');
                console.log('   ✅ Set UUID primary key for invoice_payments');
            } catch (error) {
                console.log(`   ⚠️  invoice_payments primary key: ${error.message}`);
            }
        } else {
            console.log('   ✅ invoice_payments already has proper primary key');
        }
        
        console.log('\n5. Final verification - all tables with UUID primary keys...');
        
        const finalCheck = await client.query(`
            SELECT DISTINCT t.table_name,
                   STRING_AGG(kcu.column_name, ', ') as pk_columns,
                   STRING_AGG(c.data_type, ', ') as pk_types
            FROM information_schema.tables t
            LEFT JOIN information_schema.table_constraints tc 
                ON t.table_name = tc.table_name 
                AND tc.constraint_type = 'PRIMARY KEY'
            LEFT JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            LEFT JOIN information_schema.columns c 
                ON kcu.table_name = c.table_name 
                AND kcu.column_name = c.column_name
            WHERE t.table_schema = 'public' 
                AND t.table_type = 'BASE TABLE'
                AND t.table_name NOT LIKE 'pg_%'
                AND t.table_name NOT LIKE 'sql_%'
            GROUP BY t.table_name
            ORDER BY t.table_name
        `);
        
        let uuidTables = 0;
        let totalTables = finalCheck.rows.length;
        
        console.log('\nFinal status:');
        finalCheck.rows.forEach(table => {
            const hasUuidPk = table.pk_types && table.pk_types.includes('uuid');
            const status = hasUuidPk ? '✅' : '❌';
            if (hasUuidPk) uuidTables++;
            console.log(`   ${status} ${table.table_name}: PK(${table.pk_columns || 'none'}) - ${table.pk_types || 'no primary key'}`);
        });
        
        const completionRate = Math.round((uuidTables / totalTables) * 100);
        
        console.log(`\n🎯 FINAL MIGRATION STATUS: ${completionRate}% COMPLETE`);
        console.log(`   ✅ ${uuidTables}/${totalTables} tables have UUID primary keys`);
        
        if (completionRate === 100) {
            console.log('\n🚀 MIGRATION 100% COMPLETE - ALL TABLES STANDARDIZED!');
        } else {
            console.log(`\n⚠️  ${totalTables - uuidTables} tables still need attention`);
        }
        
        client.release();
        
    } catch (error) {
        console.error('Error in final cleanup:', error);
    } finally {
        await pool.end();
    }
}

finalCleanup();
