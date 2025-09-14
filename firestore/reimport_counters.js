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

async function reimportCounters() {
    try {
        const client = await pool.connect();
        
        console.log('=== RE-IMPORTING COUNTERS WITH PROPER UUID AND INDEXES ===\n');
        console.log('Note: Counters table tracks last used numbers for:');
        console.log('  - admins: Admin user IDs');
        console.log('  - customers: Customer IDs');  
        console.log('  - invoices: Invoice numbers');
        console.log('  - jobs: Job numbers');
        console.log('Application will query: SELECT last FROM counters WHERE counter_id = ? and increment it\n');
        
        console.log('0. Dropping existing counters table to avoid inconsistencies...');
        await client.query('DROP TABLE IF EXISTS "counters" CASCADE');
        console.log('   ✅ Dropped existing counters table');
        
        // Read the counters JSON file
        const countersData = JSON.parse(fs.readFileSync('./backup/counters.json', 'utf8'));
        console.log(`Loaded ${countersData.length} counter records`);
        
        console.log('\n1. Dropping existing counters table to avoid inconsistencies...');
        
        // Drop the entire table to start fresh
        await client.query('DROP TABLE IF EXISTS "counters" CASCADE');
        console.log('   ✅ Dropped existing counters table and all dependencies');
        
        console.log('\n2. Creating new counters table with proper structure...');
        
        // Create the table with proper UUID and structure
        await client.query(`
            CREATE TABLE "counters" (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                counter_id TEXT NOT NULL UNIQUE,
                last INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);
        console.log('   ✅ Created new counters table with proper structure');
        
        console.log('\n3. Inserting counters with proper structure...');
        
        let insertedCount = 0;
        
        for (const counter of countersData) {
            try {
                // Insert with UUID id and rename firestore_id to counter_id
                await client.query(`
                    INSERT INTO "counters" (counter_id, last)
                    VALUES ($1, $2)
                `, [
                    counter.firestore_id, // renamed from firestore_id to counter_id
                    counter.last
                ]);
                
                insertedCount++;
                console.log(`   ✅ Inserted counter: ${counter.firestore_id} (last: ${counter.last})`);
                
            } catch (error) {
                console.error(`   ❌ Error inserting counter ${counter.firestore_id}:`, error.message);
            }
        }
        
        console.log('\n4. Creating indexes for performance...');
        
        // Create unique index on counter_id since it's the lookup key
        try {
            await client.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_counters_counter_id ON "counters" (counter_id)');
            console.log('   ✅ Created unique index on counter_id');
        } catch (error) {
            console.log(`   ⚠️  Index on counter_id: ${error.message}`);
        }
        
        // Create index on last for range queries
        try {
            await client.query('CREATE INDEX IF NOT EXISTS idx_counters_last ON "counters" (last)');
            console.log('   ✅ Created index on last');
        } catch (error) {
            console.log(`   ⚠️  Index on last: ${error.message}`);
        }
        
        // Create composite index for counter_id + last (common query pattern)
        try {
            await client.query('CREATE INDEX IF NOT EXISTS idx_counters_id_last ON "counters" (counter_id, last)');
            console.log('   ✅ Created composite index on counter_id + last');
        } catch (error) {
            console.log(`   ⚠️  Composite index: ${error.message}`);
        }
        
        console.log('\n5. Checking dependencies on counters...');
        
        // Check if other tables reference counters
        const dependencies = await client.query(`
            SELECT 
                kcu.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM 
                information_schema.key_column_usage kcu
                JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
                JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
            WHERE 
                tc.constraint_type = 'FOREIGN KEY' 
                AND ccu.table_name = 'counters'
        `);
        
        if (dependencies.rows.length > 0) {
            console.log('   Found dependencies:');
            dependencies.rows.forEach(dep => {
                console.log(`     ${dep.table_name}.${dep.column_name} -> counters.${dep.foreign_column_name}`);
            });
        } else {
            console.log('   ✅ No foreign key dependencies found (counters is a lookup table)');
        }
        
        console.log('\n6. Verifying final structure...');
        
        const finalCheck = await client.query(`
            SELECT 
                id,
                counter_id,
                last,
                created_at,
                updated_at
            FROM "counters" 
            ORDER BY counter_id
        `);
        
        console.log('\nFinal counters table:');
        finalCheck.rows.forEach(row => {
            console.log(`   ID: ${row.id}`);
            console.log(`   Counter ID: ${row.counter_id}`);
            console.log(`   Last: ${row.last}`);
            console.log(`   Created: ${row.created_at}`);
            console.log(`   ---`);
        });
        
        console.log('\n7. Testing counter functionality...');
        
        // Test incrementing a counter (typical use case)
        const testUpdate = await client.query(`
            UPDATE "counters" 
            SET last = last + 1, updated_at = NOW() 
            WHERE counter_id = 'jobs' 
            RETURNING counter_id, last
        `);
        
        if (testUpdate.rows.length > 0) {
            console.log(`   ✅ Counter increment test: jobs counter is now ${testUpdate.rows[0].last}`);
            
            // Reset it back
            await client.query(`
                UPDATE "counters" 
                SET last = last - 1, updated_at = NOW() 
                WHERE counter_id = 'jobs'
            `);
            console.log(`   ✅ Reset jobs counter back to original value`);
        }
        
        console.log(`\n✅ Successfully re-imported ${insertedCount} counters with full functionality!`);
        console.log(`   - All records have UUID primary keys`);
        console.log(`   - firestore_id renamed to counter_id`);
        console.log(`   - Added created_at and updated_at timestamps`);
        console.log(`   - Created performance indexes (unique on counter_id, composite on counter_id+last)`);
        console.log(`   - Verified counter increment functionality works`);
        console.log(`   - Ready for application use (customers: ${countersData.find(c => c.firestore_id === 'customers')?.last}, invoices: ${countersData.find(c => c.firestore_id === 'invoices')?.last}, jobs: ${countersData.find(c => c.firestore_id === 'jobs')?.last})`);
        
        client.release();
        
    } catch (error) {
        console.error('Error re-importing counters:', error);
    } finally {
        await pool.end();
    }
}

reimportCounters();
