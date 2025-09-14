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

async function standardizePhase2() {
    try {
        const client = await pool.connect();
        
        console.log('=== PHASE 2: UPDATING CONSTRAINTS AND DROPPING OLD COLUMNS ===\n');
        
        console.log('1. Dropping all existing foreign key constraints...');
        
        // Get all existing foreign key constraints
        const constraints = await client.query(`
            SELECT constraint_name, table_name
            FROM information_schema.table_constraints 
            WHERE constraint_type = 'FOREIGN KEY'
            AND table_schema = 'public'
            AND table_name IN ('jobs', 'invoices', 'invoice_payments', 'pricingRules', 'notification_preferences')
        `);
        
        for (const constraint of constraints.rows) {
            try {
                await client.query(`ALTER TABLE "${constraint.table_name}" DROP CONSTRAINT IF EXISTS ${constraint.constraint_name}`);
                console.log(`   ✅ Dropped constraint ${constraint.constraint_name} from ${constraint.table_name}`);
            } catch (error) {
                console.log(`   ⚠️  Error dropping constraint ${constraint.constraint_name}: ${error.message}`);
            }
        }
        
        console.log('\n2. Dropping existing primary key constraints...');
        
        const tables = ['appUsers', 'counters', 'finishOptions', 'invoices', 'jobs', 
                       'notification_preferences', 'services', 'settings', 'customers'];
        
        for (const table of tables) {
            try {
                await client.query(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${table}_pkey"`);
                console.log(`   ✅ Dropped primary key from ${table}`);
            } catch (error) {
                console.log(`   ⚠️  Error dropping primary key from ${table}: ${error.message}`);
            }
        }
        
        // Handle serial key tables
        try {
            await client.query('ALTER TABLE "pricingRules" DROP CONSTRAINT IF EXISTS "pricingRules_pkey"');
            await client.query('ALTER TABLE "invoice_payments" DROP CONSTRAINT IF EXISTS "invoice_payments_pkey"');
            console.log('   ✅ Dropped serial primary keys');
        } catch (error) {
            console.log(`   ⚠️  Error dropping serial keys: ${error.message}`);
        }
        
        console.log('\n3. Setting UUID columns as new primary keys...');
        
        for (const table of tables) {
            try {
                await client.query(`ALTER TABLE "${table}" ADD PRIMARY KEY (id)`);
                console.log(`   ✅ Set UUID primary key for ${table}`);
            } catch (error) {
                console.log(`   ❌ Error setting primary key for ${table}: ${error.message}`);
            }
        }
        
        // Handle serial key tables
        try {
            await client.query('ALTER TABLE "pricingRules" ADD PRIMARY KEY (id)');
            await client.query('ALTER TABLE "invoice_payments" ADD PRIMARY KEY (id)');
            console.log('   ✅ Set UUID primary keys for serial tables');
        } catch (error) {
            console.log(`   ❌ Error setting serial table primary keys: ${error.message}`);
        }
        
        console.log('\n4. Creating new foreign key constraints with UUIDs...');
        
        const newConstraints = [
            {
                table: 'jobs',
                column: 'customer_id',
                refTable: 'customers',
                refColumn: 'id',
                name: 'fk_jobs_customer_uuid'
            },
            {
                table: 'jobs',
                column: 'service_id',
                refTable: 'services',
                refColumn: 'id',
                name: 'fk_jobs_service_uuid'
            },
            {
                table: 'jobs',
                column: 'invoice_id',
                refTable: 'invoices',
                refColumn: 'id',
                name: 'fk_jobs_invoice_uuid'
            },
            {
                table: 'invoices',
                column: 'customer_id',
                refTable: 'customers',
                refColumn: 'id',
                name: 'fk_invoices_customer_uuid'
            },
            {
                table: 'invoice_payments',
                column: 'invoice_uuid',
                refTable: 'invoices',
                refColumn: 'id',
                name: 'fk_payments_invoice_uuid'
            },
            {
                table: 'pricingRules',
                column: 'service_id',
                refTable: 'services',
                refColumn: 'id',
                name: 'fk_pricing_service_uuid'
            }
        ];
        
        for (const fk of newConstraints) {
            try {
                await client.query(`
                    ALTER TABLE "${fk.table}" 
                    ADD CONSTRAINT ${fk.name}
                    FOREIGN KEY ("${fk.column}") 
                    REFERENCES "${fk.refTable}"("${fk.refColumn}") 
                    ON DELETE SET NULL
                `);
                console.log(`   ✅ Created ${fk.name}`);
            } catch (error) {
                console.log(`   ❌ Error creating ${fk.name}: ${error.message}`);
            }
        }
        
        console.log('\n5. Dropping firestore_id and old ID columns...');
        
        // Drop firestore_id columns from main tables
        for (const table of tables) {
            try {
                await client.query(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS firestore_id`);
                console.log(`   ✅ Dropped firestore_id from ${table}`);
            } catch (error) {
                console.log(`   ❌ Error dropping firestore_id from ${table}: ${error.message}`);
            }
        }
        
        // Drop old foreign key columns
        const oldColumns = [
            { table: 'jobs', columns: ['customerId', 'serviceId', 'invoiceId'] },
            { table: 'invoices', columns: ['customerId'] },
            { table: 'invoice_payments', columns: ['firestore_id', 'invoice_id', 'invoiceId'] },
            { table: 'pricingRules', columns: ['firestore_id', 'serviceId'] }
        ];
        
        for (const tableInfo of oldColumns) {
            for (const column of tableInfo.columns) {
                try {
                    await client.query(`ALTER TABLE "${tableInfo.table}" DROP COLUMN IF EXISTS "${column}"`);
                    console.log(`   ✅ Dropped ${tableInfo.table}.${column}`);
                } catch (error) {
                    console.log(`   ❌ Error dropping ${tableInfo.table}.${column}: ${error.message}`);
                }
            }
        }
        
        // Drop serial ID columns
        try {
            await client.query('ALTER TABLE "pricingRules" DROP COLUMN IF EXISTS id_serial');
            await client.query('ALTER TABLE "invoice_payments" DROP COLUMN IF EXISTS id_serial');
            console.log('   ✅ Dropped serial ID columns');
        } catch (error) {
            console.log(`   ❌ Error dropping serial columns: ${error.message}`);
        }
        
        console.log('\n6. Cleaning up mapping tables...');
        
        const mappingTables = ['appUsers_id_mapping', 'counters_id_mapping', 'finishOptions_id_mapping', 
                              'invoices_id_mapping', 'jobs_id_mapping', 'notification_preferences_id_mapping',
                              'services_id_mapping', 'settings_id_mapping', 'customers_id_mapping'];
        
        for (const table of mappingTables) {
            try {
                await client.query(`DROP TABLE IF EXISTS "${table}"`);
                console.log(`   ✅ Dropped mapping table ${table}`);
            } catch (error) {
                console.log(`   ❌ Error dropping ${table}: ${error.message}`);
            }
        }
        
        client.release();
        console.log('\n✅ Phase 2 complete - Database standardized to UUID format!');
        
    } catch (error) {
        console.error('Error in phase 2:', error);
    } finally {
        await pool.end();
    }
}

standardizePhase2();
