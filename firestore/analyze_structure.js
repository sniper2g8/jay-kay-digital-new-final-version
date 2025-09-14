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

async function analyzeTableStructure() {
    try {
        const client = await pool.connect();
        
        console.log('=== ANALYZING TABLE STRUCTURES AND RELATIONSHIPS ===\n');
        
        // Get all our imported tables
        const tables = ['appUsers', 'counters', 'finishOptions', 'invoices', 'jobs', 
                       'notification_preferences', 'pricingRules', 'services', 'settings', 'invoice_payments'];
        
        for (const table of tables) {
            console.log(`--- ${table} ---`);
            try {
                // Get column structure
                const columns = await client.query(`
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns 
                    WHERE table_name = $1 
                    ORDER BY ordinal_position
                `, [table]);
                
                console.log('Columns:');
                columns.rows.forEach(col => {
                    console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
                });
                
                // Sample a few rows to understand the data
                const sample = await client.query(`SELECT * FROM "${table}" LIMIT 3`);
                if (sample.rows.length > 0) {
                    console.log('Sample data fields:');
                    console.log(`  ${Object.keys(sample.rows[0]).join(', ')}`);
                    
                    // Look for potential foreign key fields
                    const fields = Object.keys(sample.rows[0]);
                    const possibleFKs = fields.filter(field => 
                        field.includes('Id') || 
                        field.includes('_id') || 
                        field.includes('customerId') ||
                        field.includes('invoiceId') ||
                        field.includes('jobId') ||
                        field.includes('userId')
                    );
                    
                    if (possibleFKs.length > 0) {
                        console.log('  Possible Foreign Keys:', possibleFKs.join(', '));
                    }
                }
                
            } catch (error) {
                console.log(`  Error analyzing ${table}:`, error.message);
            }
            console.log('');
        }
        
        client.release();
        
    } catch (error) {
        console.error('Error analyzing table structure:', error);
    } finally {
        await pool.end();
    }
}

analyzeTableStructure();
