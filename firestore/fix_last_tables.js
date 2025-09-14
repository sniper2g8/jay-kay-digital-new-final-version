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

async function fixLastTwoTables() {
    try {
        const client = await pool.connect();
        
        console.log('=== FIXING LAST TWO TABLES ===\n');
        
        console.log('1. Fixing invoice_payments and notification_preferences primary keys...');
        
        // Check invoice_payments
        console.log('\n   Processing invoice_payments...');
        const invoicePaymentsInfo = await client.query(`
            SELECT 
                column_name, 
                data_type,
                CASE WHEN tc.constraint_type = 'PRIMARY KEY' THEN 'YES' ELSE 'NO' END as is_primary_key
            FROM information_schema.columns c
            LEFT JOIN information_schema.key_column_usage kcu ON c.table_name = kcu.table_name AND c.column_name = kcu.column_name
            LEFT JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
            WHERE c.table_name = 'invoice_payments' AND c.column_name = 'id'
        `);
        
        if (invoicePaymentsInfo.rows.length > 0 && invoicePaymentsInfo.rows[0].is_primary_key === 'NO') {
            try {
                await client.query('ALTER TABLE "invoice_payments" ADD PRIMARY KEY (id)');
                console.log('     ✅ Added primary key to invoice_payments');
            } catch (error) {
                console.log(`     ⚠️  invoice_payments primary key: ${error.message}`);
            }
        } else {
            console.log('     ✅ invoice_payments already has proper primary key');
        }
        
        // Check notification_preferences
        console.log('\n   Processing notification_preferences...');
        const notificationInfo = await client.query(`
            SELECT 
                column_name, 
                data_type,
                CASE WHEN tc.constraint_type = 'PRIMARY KEY' THEN 'YES' ELSE 'NO' END as is_primary_key
            FROM information_schema.columns c
            LEFT JOIN information_schema.key_column_usage kcu ON c.table_name = kcu.table_name AND c.column_name = kcu.column_name
            LEFT JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
            WHERE c.table_name = 'notification_preferences' AND c.column_name = 'id'
        `);
        
        if (notificationInfo.rows.length > 0 && notificationInfo.rows[0].is_primary_key === 'NO') {
            try {
                await client.query('ALTER TABLE "notification_preferences" ADD PRIMARY KEY (id)');
                console.log('     ✅ Added primary key to notification_preferences');
            } catch (error) {
                console.log(`     ⚠️  notification_preferences primary key: ${error.message}`);
            }
        } else {
            console.log('     ✅ notification_preferences already has proper primary key');
        }
        
        console.log('\n2. Verifying all primary keys are now set...');
        
        const allTablesCheck = await client.query(`
            SELECT 
                t.table_name,
                c.column_name,
                c.data_type,
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
        
        const withPrimaryKey = allTablesCheck.rows.filter(r => r.is_primary_key === 'YES');
        const withoutPrimaryKey = allTablesCheck.rows.filter(r => r.is_primary_key === 'NO' || r.is_primary_key === null);
        
        console.log(`\n   ✅ Tables with primary keys: ${withPrimaryKey.length}`);
        withPrimaryKey.forEach(table => {
            console.log(`     ${table.table_name} (${table.data_type})`);
        });
        
        if (withoutPrimaryKey.length > 0) {
            console.log(`\n   ⚠️  Tables without primary keys: ${withoutPrimaryKey.length}`);
            withoutPrimaryKey.forEach(table => {
                console.log(`     ${table.table_name} (${table.data_type})`);
            });
        }
        
        console.log('\n3. Final summary...');
        console.log(`   Total tables: ${allTablesCheck.rows.length}`);
        console.log(`   With UUID primary keys: ${withPrimaryKey.filter(t => t.data_type === 'uuid').length}`);
        console.log(`   With TEXT primary keys: ${withPrimaryKey.filter(t => t.data_type === 'text').length}`);
        console.log(`   Missing primary keys: ${withoutPrimaryKey.length}`);
        
        if (withoutPrimaryKey.length === 0) {
            console.log('\n🎉 ALL TABLES NOW HAVE PRIMARY KEYS! 🎉');
        }
        
        client.release();
        
    } catch (error) {
        console.error('Error fixing last two tables:', error);
    } finally {
        await pool.end();
    }
}

fixLastTwoTables();
