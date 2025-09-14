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

async function verifyDatabaseSetup() {
    try {
        const client = await pool.connect();
        
        console.log('=== FINAL DATABASE VERIFICATION ===\n');
        
        console.log('1. Table Record Counts:');
        const tables = ['appUsers', 'counters', 'finishOptions', 'invoices', 'jobs', 
                       'notification_preferences', 'pricingRules', 'services', 'settings', 'invoice_payments'];
        
        for (const table of tables) {
            try {
                const result = await client.query(`SELECT COUNT(*) FROM "${table}"`);
                console.log(`   ${table}: ${result.rows[0].count} records`);
            } catch (error) {
                console.log(`   ${table}: Error - ${error.message}`);
            }
        }
        
        console.log('\n2. Primary Keys:');
        const pkQuery = `
            SELECT 
                t.table_name,
                string_agg(k.column_name, ', ') as primary_key_columns
            FROM information_schema.table_constraints t
            JOIN information_schema.key_column_usage k 
                ON t.constraint_name = k.constraint_name
            WHERE t.constraint_type = 'PRIMARY KEY'
            AND t.table_schema = 'public'
            AND t.table_name IN (${tables.map(t => `'${t}'`).join(',')})
            GROUP BY t.table_name
            ORDER BY t.table_name
        `;
        
        const pkResult = await client.query(pkQuery);
        pkResult.rows.forEach(row => {
            console.log(`   ${row.table_name}: ${row.primary_key_columns}`);
        });
        
        console.log('\n3. Foreign Key Relationships:');
        const fkQuery = `
            SELECT 
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
            ORDER BY tc.table_name, kcu.column_name
        `;
        
        const fkResult = await client.query(fkQuery);
        fkResult.rows.forEach(row => {
            console.log(`   ${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`);
        });
        
        console.log('\n4. Indexes:');
        const indexQuery = `
            SELECT 
                t.relname as table_name,
                i.relname as index_name,
                a.attname as column_name
            FROM pg_class t
            JOIN pg_index ix ON t.oid = ix.indrelid
            JOIN pg_class i ON i.oid = ix.indexrelid
            JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
            WHERE t.relkind = 'r'
            AND t.relname IN (${tables.map(t => `'${t}'`).join(',')})
            AND i.relname NOT LIKE '%_pkey'
            ORDER BY t.relname, i.relname, a.attname
        `;
        
        const indexResult = await client.query(indexQuery);
        const indexesByTable = {};
        
        indexResult.rows.forEach(row => {
            if (!indexesByTable[row.table_name]) {
                indexesByTable[row.table_name] = [];
            }
            indexesByTable[row.table_name].push(`${row.index_name} (${row.column_name})`);
        });
        
        Object.keys(indexesByTable).forEach(table => {
            console.log(`   ${table}:`);
            const uniqueIndexes = [...new Set(indexesByTable[table])];
            uniqueIndexes.forEach(index => {
                console.log(`     - ${index}`);
            });
        });
        
        console.log('\n5. Sample Relationship Queries:');
        
        // Test joining jobs with invoices
        try {
            const jobInvoiceTest = await client.query(`
                SELECT j.jobNo, j.title, i.invoiceNo, i.grandTotal 
                FROM "jobs" j 
                JOIN "invoices" i ON j."invoiceId" = i.firestore_id 
                LIMIT 3
            `);
            console.log(`   ✅ Jobs -> Invoices join: ${jobInvoiceTest.rows.length} results`);
            if (jobInvoiceTest.rows.length > 0) {
                console.log(`      Example: Job ${jobInvoiceTest.rows[0].jobno} -> Invoice ${jobInvoiceTest.rows[0].invoiceno}`);
            }
        } catch (error) {
            console.log(`   ❌ Jobs -> Invoices join failed: ${error.message}`);
        }
        
        // Test joining payments with invoices
        try {
            const paymentTest = await client.query(`
                SELECT p.amount, p.method, i.invoiceNo 
                FROM "invoice_payments" p 
                JOIN "invoices" i ON p.invoice_id = i.firestore_id 
                LIMIT 3
            `);
            console.log(`   ✅ Payments -> Invoices join: ${paymentTest.rows.length} results`);
            if (paymentTest.rows.length > 0) {
                console.log(`      Example: Payment ${paymentTest.rows[0].amount} -> Invoice ${paymentTest.rows[0].invoiceno}`);
            }
        } catch (error) {
            console.log(`   ❌ Payments -> Invoices join failed: ${error.message}`);
        }
        
        client.release();
        console.log('\n🎉 DATABASE VERIFICATION COMPLETE!');
        
    } catch (error) {
        console.error('Error verifying database setup:', error);
    } finally {
        await pool.end();
    }
}

verifyDatabaseSetup();
