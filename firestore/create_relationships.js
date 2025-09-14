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

async function createRelationshipsAndIndexes() {
    try {
        const client = await pool.connect();
        
        console.log('=== CREATING TABLE RELATIONSHIPS AND INDEXES ===\n');
        
        // First, let's add primary keys where firestore_id exists
        console.log('1. Adding Primary Keys...');
        const tablesWithFirestoreId = [
            'appUsers', 'counters', 'finishOptions', 'invoices', 'jobs',
            'notification_preferences', 'pricingRules', 'services', 'settings', 'invoice_payments'
        ];
        
        for (const table of tablesWithFirestoreId) {
            try {
                await client.query(`ALTER TABLE "${table}" ADD PRIMARY KEY (firestore_id)`);
                console.log(`✅ Added primary key to ${table}`);
            } catch (error) {
                if (error.message.includes('already exists')) {
                    console.log(`⚠️  Primary key already exists for ${table}`);
                } else {
                    console.log(`❌ Error adding primary key to ${table}: ${error.message}`);
                }
            }
        }
        
        console.log('\n2. Creating Foreign Key Relationships...');
        
        // Jobs -> Invoices relationship
        try {
            await client.query(`
                ALTER TABLE "jobs" 
                ADD CONSTRAINT fk_jobs_invoice 
                FOREIGN KEY ("invoiceId") 
                REFERENCES "invoices"("firestore_id") 
                ON DELETE SET NULL
            `);
            console.log('✅ Created jobs -> invoices foreign key');
        } catch (error) {
            console.log(`⚠️  Jobs -> Invoices FK: ${error.message}`);
        }
        
        // Jobs -> Services relationship  
        try {
            await client.query(`
                ALTER TABLE "jobs" 
                ADD CONSTRAINT fk_jobs_service 
                FOREIGN KEY ("serviceId") 
                REFERENCES "services"("firestore_id") 
                ON DELETE SET NULL
            `);
            console.log('✅ Created jobs -> services foreign key');
        } catch (error) {
            console.log(`⚠️  Jobs -> Services FK: ${error.message}`);
        }
        
        // Invoice Payments -> Invoices relationship
        try {
            await client.query(`
                ALTER TABLE "invoice_payments" 
                ADD CONSTRAINT fk_payments_invoice 
                FOREIGN KEY ("invoice_id") 
                REFERENCES "invoices"("firestore_id") 
                ON DELETE CASCADE
            `);
            console.log('✅ Created invoice_payments -> invoices foreign key');
        } catch (error) {
            console.log(`⚠️  Payments -> Invoices FK: ${error.message}`);
        }
        
        // PricingRules -> Services relationship
        try {
            await client.query(`
                ALTER TABLE "pricingRules" 
                ADD CONSTRAINT fk_pricing_service 
                FOREIGN KEY ("serviceId") 
                REFERENCES "services"("firestore_id") 
                ON DELETE CASCADE
            `);
            console.log('✅ Created pricingRules -> services foreign key');
        } catch (error) {
            console.log(`⚠️  PricingRules -> Services FK: ${error.message}`);
        }
        
        console.log('\n3. Creating Performance Indexes...');
        
        // Indexes for frequently queried fields
        const indexes = [
            // Invoice related indexes
            { table: 'invoices', column: 'invoiceNo', name: 'idx_invoices_invoice_no' },
            { table: 'invoices', column: 'customerId', name: 'idx_invoices_customer_id' },
            { table: 'invoices', column: 'status', name: 'idx_invoices_status' },
            
            // Job related indexes
            { table: 'jobs', column: 'jobNo', name: 'idx_jobs_job_no' },
            { table: 'jobs', column: 'customerId', name: 'idx_jobs_customer_id' },
            { table: 'jobs', column: 'serviceId', name: 'idx_jobs_service_id' },
            { table: 'jobs', column: 'invoiceId', name: 'idx_jobs_invoice_id' },
            { table: 'jobs', column: 'status', name: 'idx_jobs_status' },
            
            // Payment related indexes
            { table: 'invoice_payments', column: 'invoice_id', name: 'idx_payments_invoice_id' },
            { table: 'invoice_payments', column: 'method', name: 'idx_payments_method' },
            
            // Service related indexes
            { table: 'services', column: 'active', name: 'idx_services_active' },
            { table: 'services', column: 'slug', name: 'idx_services_slug' },
            
            // Pricing rules indexes
            { table: 'pricingRules', column: 'serviceId', name: 'idx_pricing_service_id' },
            { table: 'pricingRules', column: 'ruleType', name: 'idx_pricing_rule_type' },
            
            // User related indexes
            { table: 'appUsers', column: 'email', name: 'idx_users_email' },
            { table: 'appUsers', column: 'role', name: 'idx_users_role' },
            
            // Notification preferences
            { table: 'notification_preferences', column: 'user_id', name: 'idx_notifications_user_id' }
        ];
        
        for (const idx of indexes) {
            try {
                await client.query(`
                    CREATE INDEX IF NOT EXISTS ${idx.name} 
                    ON "${idx.table}" ("${idx.column}")
                `);
                console.log(`✅ Created index ${idx.name} on ${idx.table}.${idx.column}`);
            } catch (error) {
                console.log(`❌ Error creating index ${idx.name}: ${error.message}`);
            }
        }
        
        console.log('\n4. Creating Composite Indexes...');
        
        // Composite indexes for common query patterns
        const compositeIndexes = [
            {
                name: 'idx_jobs_customer_status',
                table: 'jobs',
                columns: ['customerId', 'status'],
                sql: 'CREATE INDEX IF NOT EXISTS idx_jobs_customer_status ON "jobs" ("customerId", "status")'
            },
            {
                name: 'idx_invoices_customer_status',
                table: 'invoices', 
                columns: ['customerId', 'status'],
                sql: 'CREATE INDEX IF NOT EXISTS idx_invoices_customer_status ON "invoices" ("customerId", "status")'
            },
            {
                name: 'idx_payments_invoice_date',
                table: 'invoice_payments',
                columns: ['invoice_id', 'receivedAt'],
                sql: 'CREATE INDEX IF NOT EXISTS idx_payments_invoice_date ON "invoice_payments" ("invoice_id", "receivedAt")'
            }
        ];
        
        for (const idx of compositeIndexes) {
            try {
                await client.query(idx.sql);
                console.log(`✅ Created composite index ${idx.name}`);
            } catch (error) {
                console.log(`❌ Error creating composite index ${idx.name}: ${error.message}`);
            }
        }
        
        client.release();
        console.log('\n✅ Database relationships and indexes setup complete!');
        
    } catch (error) {
        console.error('Error creating relationships and indexes:', error);
    } finally {
        await pool.end();
    }
}

createRelationshipsAndIndexes();
