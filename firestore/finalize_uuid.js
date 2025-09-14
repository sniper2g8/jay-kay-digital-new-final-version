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

async function finalizeUuidMigration() {
    try {
        const client = await pool.connect();
        
        console.log('=== FINALIZING UUID MIGRATION ===\n');
        
        console.log('1. Fixing remaining NULL UUIDs with simple update...');
        
        // Simple UUID generation without triggers
        try {
            const result1 = await client.query(`UPDATE "counters" SET id = gen_random_uuid() WHERE id IS NULL`);
            console.log(`   ✅ Updated ${result1.rowCount} NULL UUIDs in counters`);
        } catch (error) {
            console.log(`   ❌ Error updating counters: ${error.message}`);
        }
        
        try {
            const result2 = await client.query(`UPDATE "notification_preferences" SET id = gen_random_uuid() WHERE id IS NULL`);
            console.log(`   ✅ Updated ${result2.rowCount} NULL UUIDs in notification_preferences`);
        } catch (error) {
            console.log(`   ❌ Error updating notification_preferences: ${error.message}`);
        }
        
        console.log('\n2. Setting primary keys for remaining tables...');
        
        try {
            await client.query('ALTER TABLE "counters" ADD PRIMARY KEY (id)');
            console.log('   ✅ Set primary key for counters');
        } catch (error) {
            console.log(`   ⚠️  Counters primary key: ${error.message}`);
        }
        
        try {
            await client.query('ALTER TABLE "notification_preferences" ADD PRIMARY KEY (id)');
            console.log('   ✅ Set primary key for notification_preferences');
        } catch (error) {
            console.log(`   ⚠️  Notification_preferences primary key: ${error.message}`);
        }
        
        console.log('\n3. Final verification of database structure...');
        
        // Get all tables and their primary keys
        const tables = await client.query(`
            SELECT 
                t.table_name,
                string_agg(k.column_name, ', ') as primary_key_columns
            FROM information_schema.table_constraints t
            JOIN information_schema.key_column_usage k 
                ON t.constraint_name = k.constraint_name
            WHERE t.constraint_type = 'PRIMARY KEY'
            AND t.table_schema = 'public'
            AND t.table_name IN ('appUsers', 'counters', 'finishOptions', 'invoices', 'jobs', 'notification_preferences', 'pricingRules', 'services', 'settings', 'customers', 'invoice_payments')
            GROUP BY t.table_name
            ORDER BY t.table_name
        `);
        
        console.log('   Tables with UUID primary keys:');
        tables.rows.forEach(row => {
            console.log(`     ${row.table_name}: ${row.primary_key_columns}`);
        });
        
        console.log('\n4. Record counts verification...');
        
        const allTables = ['appUsers', 'counters', 'finishOptions', 'invoices', 'jobs', 
                          'notification_preferences', 'pricingRules', 'services', 'settings', 
                          'customers', 'invoice_payments'];
        
        for (const table of allTables) {
            try {
                const count = await client.query(`SELECT COUNT(*) FROM "${table}"`);
                console.log(`     ${table}: ${count.rows[0].count} records`);
            } catch (error) {
                console.log(`     ${table}: Error - ${error.message}`);
            }
        }
        
        console.log('\n5. Testing sample relationships...');
        
        try {
            const relationshipTest = await client.query(`
                SELECT 
                    j.title as job_title,
                    c.name as customer_name,
                    s.title as service_title
                FROM "jobs" j
                LEFT JOIN "customers" c ON j.customer_id = c.id
                LEFT JOIN "services" s ON j.service_id = s.id
                WHERE j.customer_id IS NOT NULL
                LIMIT 3
            `);
            
            console.log(`   ✅ Relationship test passed: ${relationshipTest.rows.length} results`);
            relationshipTest.rows.forEach(row => {
                console.log(`     ${row.job_title} | Customer: ${row.customer_name} | Service: ${row.service_title || 'N/A'}`);
            });
        } catch (error) {
            console.log(`   ❌ Relationship test failed: ${error.message}`);
        }
        
        client.release();
        console.log('\n🎉 UUID MIGRATION COMPLETED!');
        
    } catch (error) {
        console.error('Error in final migration:', error);
    } finally {
        await pool.end();
    }
}

finalizeUuidMigration();
