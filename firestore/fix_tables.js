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

async function fixTables() {
    try {
        const client = await pool.connect();
        
        console.log('Dropping problematic tables...');
        
        // Drop tables that have schema issues
        await client.query('DROP TABLE IF EXISTS settings CASCADE;');
        console.log('✅ Dropped settings table');
        
        await client.query('DROP TABLE IF EXISTS services CASCADE;');
        console.log('✅ Dropped services table');
        
        await client.query('DROP TABLE IF EXISTS invoices CASCADE;');
        console.log('✅ Dropped invoices table');
        
        await client.query('DROP TABLE IF EXISTS jobs CASCADE;');
        console.log('✅ Dropped jobs table');
        
        client.release();
        console.log('\nAll problematic tables dropped. Ready for reimport.');
        
    } catch (error) {
        console.error('Error fixing tables:', error);
    } finally {
        await pool.end();
    }
}

fixTables();
