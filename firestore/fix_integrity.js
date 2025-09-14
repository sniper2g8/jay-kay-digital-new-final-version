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

async function fixDataIntegrityIssues() {
    try {
        const client = await pool.connect();
        
        console.log('=== FIXING DATA INTEGRITY ISSUES ===\n');
        
        console.log('1. Checking for duplicate firestore_id values...');
        
        // Check pricingRules duplicates
        const pricingDupes = await client.query(`
            SELECT firestore_id, COUNT(*) as count 
            FROM "pricingRules" 
            GROUP BY firestore_id 
            HAVING COUNT(*) > 1
        `);
        
        if (pricingDupes.rows.length > 0) {
            console.log(`Found ${pricingDupes.rows.length} duplicate firestore_id values in pricingRules`);
            
            // Add a serial primary key to pricingRules instead
            await client.query('ALTER TABLE "pricingRules" ADD COLUMN id_serial SERIAL PRIMARY KEY');
            console.log('✅ Added serial primary key to pricingRules');
        }
        
        // Check invoice_payments duplicates
        const paymentDupes = await client.query(`
            SELECT firestore_id, COUNT(*) as count 
            FROM "invoice_payments" 
            GROUP BY firestore_id 
            HAVING COUNT(*) > 1
        `);
        
        if (paymentDupes.rows.length > 0) {
            console.log(`Found ${paymentDupes.rows.length} duplicate firestore_id values in invoice_payments`);
            
            // Add a serial primary key to invoice_payments instead
            await client.query('ALTER TABLE "invoice_payments" ADD COLUMN id_serial SERIAL PRIMARY KEY');
            console.log('✅ Added serial primary key to invoice_payments');
        }
        
        console.log('\n2. Checking for orphaned foreign key references...');
        
        // Check jobs with invalid invoiceId references
        const orphanedJobInvoices = await client.query(`
            SELECT j.firestore_id, j."invoiceId" 
            FROM "jobs" j 
            LEFT JOIN "invoices" i ON j."invoiceId" = i.firestore_id 
            WHERE j."invoiceId" IS NOT NULL 
            AND j."invoiceId" != '' 
            AND i.firestore_id IS NULL
        `);
        
        if (orphanedJobInvoices.rows.length > 0) {
            console.log(`Found ${orphanedJobInvoices.rows.length} jobs with invalid invoiceId references`);
            
            // Set orphaned invoiceId to NULL
            await client.query(`
                UPDATE "jobs" 
                SET "invoiceId" = NULL 
                WHERE "invoiceId" NOT IN (SELECT firestore_id FROM "invoices")
                AND "invoiceId" IS NOT NULL 
                AND "invoiceId" != ''
            `);
            console.log('✅ Fixed orphaned job -> invoice references');
        }
        
        // Check jobs with invalid serviceId references
        const orphanedJobServices = await client.query(`
            SELECT j.firestore_id, j."serviceId" 
            FROM "jobs" j 
            LEFT JOIN "services" s ON j."serviceId" = s.firestore_id 
            WHERE j."serviceId" IS NOT NULL 
            AND j."serviceId" != '' 
            AND s.firestore_id IS NULL
        `);
        
        if (orphanedJobServices.rows.length > 0) {
            console.log(`Found ${orphanedJobServices.rows.length} jobs with invalid serviceId references`);
            
            // Set orphaned serviceId to NULL
            await client.query(`
                UPDATE "jobs" 
                SET "serviceId" = NULL 
                WHERE "serviceId" NOT IN (SELECT firestore_id FROM "services")
                AND "serviceId" IS NOT NULL 
                AND "serviceId" != ''
            `);
            console.log('✅ Fixed orphaned job -> service references');
        }
        
        // Check pricingRules with invalid serviceId references  
        const orphanedPricingServices = await client.query(`
            SELECT p.firestore_id, p."serviceId" 
            FROM "pricingRules" p 
            LEFT JOIN "services" s ON p."serviceId" = s.firestore_id 
            WHERE p."serviceId" IS NOT NULL 
            AND p."serviceId" != '' 
            AND s.firestore_id IS NULL
        `);
        
        if (orphanedPricingServices.rows.length > 0) {
            console.log(`Found ${orphanedPricingServices.rows.length} pricingRules with invalid serviceId references`);
            
            // Delete orphaned pricing rules
            await client.query(`
                DELETE FROM "pricingRules" 
                WHERE "serviceId" NOT IN (SELECT firestore_id FROM "services")
                AND "serviceId" IS NOT NULL 
                AND "serviceId" != ''
            `);
            console.log('✅ Removed orphaned pricing rules');
        }
        
        console.log('\n3. Now attempting to create foreign keys again...');
        
        // Try to create the foreign keys again
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
        
        client.release();
        console.log('\n✅ Data integrity issues fixed!');
        
    } catch (error) {
        console.error('Error fixing data integrity:', error);
    } finally {
        await pool.end();
    }
}

fixDataIntegrityIssues();
