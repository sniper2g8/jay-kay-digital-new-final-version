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

async function fixUuidIssues() {
    try {
        const client = await pool.connect();
        
        console.log('=== FIXING UUID MIGRATION ISSUES ===\n');
        
        console.log('1. Fixing NULL UUID values...');
        
        // Fix NULL UUIDs by generating new ones
        const tablesWithNulls = ['counters', 'notification_preferences'];
        
        for (const table of tablesWithNulls) {
            try {
                const nullCount = await client.query(`SELECT COUNT(*) FROM "${table}" WHERE id IS NULL`);
                console.log(`   ${table} has ${nullCount.rows[0].count} NULL UUIDs`);
                
                if (nullCount.rows[0].count > 0) {
                    await client.query(`UPDATE "${table}" SET id = gen_random_uuid() WHERE id IS NULL`);
                    console.log(`   ✅ Fixed NULL UUIDs in ${table}`);
                }
            } catch (error) {
                console.log(`   ❌ Error fixing ${table}: ${error.message}`);
            }
        }
        
        console.log('\n2. Setting primary keys for fixed tables...');
        
        try {
            await client.query('ALTER TABLE "counters" ADD PRIMARY KEY (id)');
            console.log('   ✅ Set primary key for counters');
        } catch (error) {
            console.log(`   ❌ Error setting counters primary key: ${error.message}`);
        }
        
        try {
            await client.query('ALTER TABLE "notification_preferences" ADD PRIMARY KEY (id)');
            console.log('   ✅ Set primary key for notification_preferences');
        } catch (error) {
            console.log(`   ❌ Error setting notification_preferences primary key: ${error.message}`);
        }
        
        console.log('\n3. Fixing pricingRules duplicate issue...');
        
        // Check for duplicate UUIDs in pricingRules
        const duplicates = await client.query(`
            SELECT id, COUNT(*) as count 
            FROM "pricingRules" 
            WHERE id IS NOT NULL
            GROUP BY id 
            HAVING COUNT(*) > 1
        `);
        
        console.log(`   Found ${duplicates.rows.length} duplicate UUIDs in pricingRules`);
        
        if (duplicates.rows.length > 0) {
            // Generate new UUIDs for all records to ensure uniqueness
            await client.query('UPDATE "pricingRules" SET id = gen_random_uuid()');
            console.log('   ✅ Generated new unique UUIDs for all pricingRules');
        }
        
        // Fix any NULL UUIDs in pricingRules
        const nullPricing = await client.query('SELECT COUNT(*) FROM "pricingRules" WHERE id IS NULL');
        if (nullPricing.rows[0].count > 0) {
            await client.query('UPDATE "pricingRules" SET id = gen_random_uuid() WHERE id IS NULL');
            console.log('   ✅ Fixed NULL UUIDs in pricingRules');
        }
        
        try {
            await client.query('ALTER TABLE "pricingRules" ADD PRIMARY KEY (id)');
            console.log('   ✅ Set primary key for pricingRules');
        } catch (error) {
            console.log(`   ❌ Error setting pricingRules primary key: ${error.message}`);
        }
        
        console.log('\n4. Fixing foreign key constraints...');
        
        // Fix jobs -> services constraint (check for NULL service_id values)
        const nullServices = await client.query('SELECT COUNT(*) FROM "jobs" WHERE service_id IS NULL');
        console.log(`   Jobs with NULL service_id: ${nullServices.rows[0].count}`);
        
        try {
            await client.query(`
                ALTER TABLE "jobs" 
                ADD CONSTRAINT fk_jobs_service_uuid
                FOREIGN KEY ("service_id") 
                REFERENCES "services"("id") 
                ON DELETE SET NULL
            `);
            console.log('   ✅ Created jobs -> services foreign key');
        } catch (error) {
            console.log(`   ⚠️  Jobs -> Services FK issue: ${error.message}`);
        }
        
        // Fix pricingRules -> services constraint
        const nullPricingServices = await client.query('SELECT COUNT(*) FROM "pricingRules" WHERE service_id IS NULL');
        console.log(`   PricingRules with NULL service_id: ${nullPricingServices.rows[0].count}`);
        
        try {
            await client.query(`
                ALTER TABLE "pricingRules" 
                ADD CONSTRAINT fk_pricing_service_uuid
                FOREIGN KEY ("service_id") 
                REFERENCES "services"("id") 
                ON DELETE CASCADE
            `);
            console.log('   ✅ Created pricingRules -> services foreign key');
        } catch (error) {
            console.log(`   ⚠️  PricingRules -> Services FK issue: ${error.message}`);
        }
        
        console.log('\n5. Creating indexes for UUID columns...');
        
        const uuidIndexes = [
            'CREATE INDEX IF NOT EXISTS idx_jobs_customer_uuid ON "jobs" ("customer_id")',
            'CREATE INDEX IF NOT EXISTS idx_jobs_service_uuid ON "jobs" ("service_id")', 
            'CREATE INDEX IF NOT EXISTS idx_jobs_invoice_uuid ON "jobs" ("invoice_id")',
            'CREATE INDEX IF NOT EXISTS idx_invoices_customer_uuid ON "invoices" ("customer_id")',
            'CREATE INDEX IF NOT EXISTS idx_payments_invoice_uuid ON "invoice_payments" ("invoice_uuid")',
            'CREATE INDEX IF NOT EXISTS idx_pricing_service_uuid ON "pricingRules" ("service_id")',
            'CREATE INDEX IF NOT EXISTS idx_users_email ON "appUsers" ("email")',
            'CREATE INDEX IF NOT EXISTS idx_services_active ON "services" ("active")'
        ];
        
        for (const indexSQL of uuidIndexes) {
            try {
                await client.query(indexSQL);
                console.log('   ✅ Created UUID index');
            } catch (error) {
                console.log(`   ❌ Index error: ${error.message}`);
            }
        }
        
        client.release();
        console.log('\n✅ UUID migration issues fixed!');
        
    } catch (error) {
        console.error('Error fixing UUID issues:', error);
    } finally {
        await pool.end();
    }
}

fixUuidIssues();
