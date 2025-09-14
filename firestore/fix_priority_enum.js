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

async function fixMissingPriorityEnum() {
    try {
        const client = await pool.connect();
        
        console.log('=== FIXING MISSING PRIORITY_LEVEL ENUM ===\n');
        
        // Create the missing priority_level enum
        try {
            const existsResult = await client.query(`
                SELECT 1 FROM pg_type 
                WHERE typname = 'priority_level' AND typtype = 'e'
            `);
            
            if (existsResult.rows.length === 0) {
                await client.query(`CREATE TYPE priority_level AS ENUM ('low', 'normal', 'high', 'urgent')`);
                console.log('✅ Created priority_level ENUM type');
            } else {
                console.log('⚠️  priority_level ENUM already exists');
            }
        } catch (error) {
            console.log(`❌ Error creating priority_level ENUM: ${error.message}`);
        }
        
        // Add the priority column to jobs table
        try {
            await client.query(`ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS priority priority_level DEFAULT 'normal'`);
            console.log('✅ Added priority column to jobs table');
        } catch (error) {
            console.log(`⚠️  Priority column: ${error.message}`);
        }
        
        // Create the missing index
        try {
            await client.query(`CREATE INDEX IF NOT EXISTS idx_jobs_priority ON "jobs"(priority)`);
            console.log('✅ Created index on jobs.priority');
        } catch (error) {
            console.log(`⚠️  Priority index: ${error.message}`);
        }
        
        console.log('\n✅ Priority enum and column setup complete!');
        
        client.release();
        
    } catch (error) {
        console.error('Error fixing priority enum:', error);
    } finally {
        await pool.end();
    }
}

fixMissingPriorityEnum();
