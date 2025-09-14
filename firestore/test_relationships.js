const { Pool } = require('pg');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./supabase-service.json', 'utf8'));
const pool = new Pool(config);

(async () => {
    const client = await pool.connect();
    try {
        console.log('Testing table relationships...');
        
        const test1 = await client.query(`
            SELECT j."jobNo", j.title, i."invoiceNo", i."grandTotal" 
            FROM "jobs" j 
            JOIN "invoices" i ON j."invoiceId" = i.firestore_id 
            LIMIT 2
        `);
        console.log('✅ Jobs -> Invoices relationship:', test1.rows.length, 'matches');
        
        const test2 = await client.query(`
            SELECT p.amount, p.method, i."invoiceNo" 
            FROM "invoice_payments" p 
            JOIN "invoices" i ON p.invoice_id = i.firestore_id 
            LIMIT 2
        `);
        console.log('✅ Payments -> Invoices relationship:', test2.rows.length, 'matches');
        
        const test3 = await client.query(`
            SELECT j."jobNo", s.title as service_title
            FROM "jobs" j 
            JOIN "services" s ON j."serviceId" = s.firestore_id 
            LIMIT 2
        `);
        console.log('✅ Jobs -> Services relationship:', test3.rows.length, 'matches');
        
    } finally {
        client.release();
        await pool.end();
    }
})();
