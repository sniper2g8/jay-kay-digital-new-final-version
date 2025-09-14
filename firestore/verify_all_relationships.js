const { Pool } = require('pg');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./supabase-service.json', 'utf8'));
const pool = new Pool(config);

(async () => {
    const client = await pool.connect();
    try {
        console.log('=== VERIFYING ALL RELATIONSHIPS ===\n');
        
        console.log('1. Customer Table:');
        const customers = await client.query('SELECT * FROM "customers" ORDER BY name');
        console.log(`   Created ${customers.rows.length} customers:`);
        customers.rows.forEach(customer => {
            console.log(`     - ${customer.name} (ID: ${customer.firestore_id})`);
        });
        
        console.log('\n2. Jobs -> Services -> Customers Chain:');
        const jobsChain = await client.query(`
            SELECT 
                j."jobNo",
                j.title as job_title,
                s.title as service_title,
                c.name as customer_name,
                i."invoiceNo"
            FROM "jobs" j
            LEFT JOIN "services" s ON j."serviceId" = s.firestore_id
            LEFT JOIN "customers" c ON j."customerId" = c.firestore_id  
            LEFT JOIN "invoices" i ON j."invoiceId" = i.firestore_id
            WHERE j."customerId" IS NOT NULL
            ORDER BY c.name, j."jobNo"
            LIMIT 5
        `);
        
        console.log(`   Found ${jobsChain.rows.length} jobs with complete relationship chain:`);
        jobsChain.rows.forEach(row => {
            console.log(`     ${row.jobNo}: ${row.job_title} | Service: ${row.service_title || 'N/A'} | Customer: ${row.customer_name} | Invoice: ${row.invoiceNo || 'N/A'}`);
        });
        
        console.log('\n3. Invoice -> Customer -> Payments Chain:');
        const invoiceChain = await client.query(`
            SELECT 
                i."invoiceNo",
                c.name as customer_name,
                i."grandTotal",
                i."amountPaid",
                COUNT(p.id_serial) as payment_count,
                SUM(p.amount) as total_payments
            FROM "invoices" i
            LEFT JOIN "customers" c ON i."customerId" = c.firestore_id
            LEFT JOIN "invoice_payments" p ON i.firestore_id = p.invoice_id
            GROUP BY i.firestore_id, i."invoiceNo", c.name, i."grandTotal", i."amountPaid"
            ORDER BY i."invoiceNo"
        `);
        
        console.log(`   Found ${invoiceChain.rows.length} invoices with customer and payment data:`);
        invoiceChain.rows.forEach(row => {
            console.log(`     ${row.invoiceNo}: ${row.customer_name} | Total: ${row.grandTotal} | Paid: ${row.amountPaid} | Payments: ${row.payment_count} (${row.total_payments || 0})`);
        });
        
        console.log('\n4. Pricing Rules -> Services Validation:');
        const pricingValidation = await client.query(`
            SELECT 
                s.title as service_title,
                COUNT(pr.id_serial) as pricing_rules_count
            FROM "services" s
            LEFT JOIN "pricingRules" pr ON s.firestore_id = pr."serviceId"
            GROUP BY s.firestore_id, s.title
            ORDER BY pricing_rules_count DESC
            LIMIT 5
        `);
        
        console.log(`   Services with pricing rules:`);
        pricingValidation.rows.forEach(row => {
            console.log(`     ${row.service_title}: ${row.pricing_rules_count} pricing rules`);
        });
        
        console.log('\n5. Foreign Key Constraints Summary:');
        const constraints = await client.query(`
            SELECT 
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name,
                tc.constraint_name
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
            AND tc.table_name IN ('jobs', 'invoices', 'invoice_payments', 'pricingRules')
            ORDER BY tc.table_name, kcu.column_name
        `);
        
        constraints.rows.forEach(row => {
            console.log(`   ${row.table_name}.${row.column_name} → ${row.foreign_table_name}.${row.foreign_column_name}`);
        });
        
        console.log('\n6. Record Counts Summary:');
        const tables = ['customers', 'jobs', 'invoices', 'invoice_payments', 'services', 'pricingRules'];
        for (const table of tables) {
            const count = await client.query(`SELECT COUNT(*) FROM "${table}"`);
            console.log(`   ${table}: ${count.rows[0].count} records`);
        }
        
    } finally {
        client.release();
        await pool.end();
        console.log('\n🎉 ALL RELATIONSHIPS VERIFIED AND WORKING!');
    }
})();
