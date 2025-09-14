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

async function fixRelationshipIssues() {
    try {
        const client = await pool.connect();
        
        console.log('=== FIXING RELATIONSHIP ISSUES ===\n');
        
        console.log('1. Analyzing current pricing rules with invalid serviceId...');
        
        // Check for pricing rules with invalid serviceId
        const invalidPricingRules = await client.query(`
            SELECT 
                COUNT(*) as total_invalid,
                array_agg(DISTINCT p."serviceId") as invalid_service_ids
            FROM "pricingRules" p 
            LEFT JOIN "services" s ON p."serviceId" = s.firestore_id 
            WHERE p."serviceId" IS NOT NULL 
            AND p."serviceId" != '' 
            AND s.firestore_id IS NULL
        `);
        
        console.log(`   Found ${invalidPricingRules.rows[0].total_invalid} pricing rules with invalid serviceId`);
        if (invalidPricingRules.rows[0].invalid_service_ids) {
            console.log(`   Invalid serviceIds: ${invalidPricingRules.rows[0].invalid_service_ids.slice(0, 5).join(', ')}...`);
        }
        
        // Remove invalid pricing rules
        if (invalidPricingRules.rows[0].total_invalid > 0) {
            const deleteResult = await client.query(`
                DELETE FROM "pricingRules" 
                WHERE "serviceId" NOT IN (SELECT firestore_id FROM "services")
                AND "serviceId" IS NOT NULL 
                AND "serviceId" != ''
            `);
            console.log(`   ✅ Removed ${deleteResult.rowCount} invalid pricing rules`);
        }
        
        console.log('\n2. Analyzing customer relationships...');
        
        // Check if we have a customers table or if customers are in appUsers
        const customerCheck = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('customers', 'appUsers')
            ORDER BY table_name
        `);
        
        console.log(`   Available customer-related tables: ${customerCheck.rows.map(r => r.table_name).join(', ')}`);
        
        // Check what customer references exist in jobs and invoices
        const customerRefs = await client.query(`
            SELECT 
                'jobs' as table_name,
                COUNT(DISTINCT "customerId") as unique_customer_ids,
                COUNT(*) as total_records_with_customer_id
            FROM "jobs" 
            WHERE "customerId" IS NOT NULL AND "customerId" != ''
            
            UNION ALL
            
            SELECT 
                'invoices' as table_name,
                COUNT(DISTINCT "customerId") as unique_customer_ids,
                COUNT(*) as total_records_with_customer_id
            FROM "invoices" 
            WHERE "customerId" IS NOT NULL AND "customerId" != ''
        `);
        
        console.log('   Customer ID usage:');
        customerRefs.rows.forEach(row => {
            console.log(`     ${row.table_name}: ${row.unique_customer_ids} unique IDs, ${row.total_records_with_customer_id} records`);
        });
        
        console.log('\n3. Creating customer table if needed...');
        
        // Check if we need to create a customers table based on the customerIds in jobs/invoices
        const jobCustomers = await client.query(`
            SELECT DISTINCT 
                "customerId", 
                "customerName",
                COUNT(*) as job_count
            FROM "jobs" 
            WHERE "customerId" IS NOT NULL AND "customerId" != ''
            GROUP BY "customerId", "customerName"
            ORDER BY job_count DESC
            LIMIT 10
        `);
        
        const invoiceCustomers = await client.query(`
            SELECT DISTINCT 
                "customerId", 
                "customerName",
                COUNT(*) as invoice_count
            FROM "invoices" 
            WHERE "customerId" IS NOT NULL AND "customerId" != ''
            GROUP BY "customerId", "customerName"
            ORDER BY invoice_count DESC
            LIMIT 10
        `);
        
        if (jobCustomers.rows.length > 0 || invoiceCustomers.rows.length > 0) {
            console.log('   Creating customers table from job and invoice data...');
            
            // Create customers table
            await client.query(`
                CREATE TABLE IF NOT EXISTS "customers" (
                    firestore_id TEXT PRIMARY KEY,
                    name TEXT,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
            `);
            
            // Insert unique customers from jobs and invoices
            await client.query(`
                INSERT INTO "customers" (firestore_id, name)
                SELECT DISTINCT 
                    COALESCE(j."customerId", i."customerId") as firestore_id,
                    COALESCE(j."customerName", i."customerName") as name
                FROM (
                    SELECT "customerId", "customerName" FROM "jobs" 
                    WHERE "customerId" IS NOT NULL AND "customerId" != ''
                    UNION 
                    SELECT "customerId", "customerName" FROM "invoices" 
                    WHERE "customerId" IS NOT NULL AND "customerId" != ''
                ) combined
                LEFT JOIN "jobs" j ON j."customerId" = combined."customerId"
                LEFT JOIN "invoices" i ON i."customerId" = combined."customerId"
                ON CONFLICT (firestore_id) DO NOTHING
            `);
            
            const customerCount = await client.query('SELECT COUNT(*) FROM "customers"');
            console.log(`   ✅ Created customers table with ${customerCount.rows[0].count} customers`);
        }
        
        console.log('\n4. Establishing proper foreign key relationships...');
        
        // Drop existing constraints that might conflict
        try {
            await client.query('ALTER TABLE "jobs" DROP CONSTRAINT IF EXISTS fk_jobs_customer');
            await client.query('ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS fk_invoices_customer');
        } catch (error) {
            // Ignore errors if constraints don't exist
        }
        
        // Create foreign key relationships
        try {
            await client.query(`
                ALTER TABLE "jobs" 
                ADD CONSTRAINT fk_jobs_customer 
                FOREIGN KEY ("customerId") 
                REFERENCES "customers"("firestore_id") 
                ON DELETE SET NULL
            `);
            console.log('   ✅ Created jobs -> customers foreign key');
        } catch (error) {
            console.log(`   ⚠️  Jobs -> Customers FK error: ${error.message}`);
        }
        
        try {
            await client.query(`
                ALTER TABLE "invoices" 
                ADD CONSTRAINT fk_invoices_customer 
                FOREIGN KEY ("customerId") 
                REFERENCES "customers"("firestore_id") 
                ON DELETE SET NULL
            `);
            console.log('   ✅ Created invoices -> customers foreign key');
        } catch (error) {
            console.log(`   ⚠️  Invoices -> Customers FK error: ${error.message}`);
        }
        
        console.log('\n5. Creating indexes for customer relationships...');
        
        const customerIndexes = [
            'CREATE INDEX IF NOT EXISTS idx_customers_name ON "customers" ("name")',
            'CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON "jobs" ("customerId")',
            'CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON "invoices" ("customerId")'
        ];
        
        for (const indexSQL of customerIndexes) {
            try {
                await client.query(indexSQL);
                console.log(`   ✅ Created customer-related index`);
            } catch (error) {
                console.log(`   ⚠️  Index creation error: ${error.message}`);
            }
        }
        
        client.release();
        console.log('\n✅ Relationship issues fixed!');
        
    } catch (error) {
        console.error('Error fixing relationships:', error);
    } finally {
        await pool.end();
    }
}

fixRelationshipIssues();
