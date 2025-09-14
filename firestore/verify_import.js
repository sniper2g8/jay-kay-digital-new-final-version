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

async function verifyImport() {
    try {
        const client = await pool.connect();
        
        console.log('Verifying import results...\n');
        
        // List of tables to check
        const tables = [
            'appUsers',
            'counters', 
            'finishOptions',
            'invoices',
            'jobs',
            'notification_preferences',
            'pricingRules',
            'services',
            'settings',
            'invoice_payments'
        ];
        
        for (const table of tables) {
            try {
                const result = await client.query(`SELECT COUNT(*) FROM "${table}"`);
                console.log(`✅ ${table}: ${result.rows[0].count} records`);
            } catch (error) {
                console.log(`❌ ${table}: Table not found or error - ${error.message}`);
            }
        }
        
        // Check auth users
        try {
            const authResult = await client.query('SELECT COUNT(*) FROM auth.users');
            console.log(`✅ auth.users: ${authResult.rows[0].count} users`);
        } catch (error) {
            console.log(`❌ auth.users: Error - ${error.message}`);
        }
        
        client.release();
        
    } catch (error) {
        console.error('Error verifying import:', error);
    } finally {
        await pool.end();
    }
}

verifyImport();
