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

async function fixFinishOptions() {
    try {
        const client = await pool.connect();
        
        console.log('=== FIXING FINISHOPTIONS TABLE ===\n');
        
        console.log('1. Checking current finishOptions structure...');
        
        // Check current structure
        const currentStructure = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'finishOptions' 
            ORDER BY ordinal_position
        `);
        
        console.log('Current structure:');
        currentStructure.rows.forEach(col => {
            console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'}) ${col.column_default ? `default: ${col.column_default}` : ''}`);
        });
        
        // Check if it has proper primary key
        const primaryKey = await client.query(`
            SELECT column_name
            FROM information_schema.key_column_usage kcu
            JOIN information_schema.table_constraints tc 
            ON kcu.constraint_name = tc.constraint_name
            WHERE tc.table_name = 'finishOptions' 
            AND tc.constraint_type = 'PRIMARY KEY'
        `);
        
        if (primaryKey.rows.length === 0) {
            console.log('   ❌ No primary key found');
            
            console.log('\n2. Adding UUID primary key...');
            
            // Add UUID column if it doesn't exist
            try {
                await client.query('ALTER TABLE "finishOptions" ADD COLUMN id UUID DEFAULT gen_random_uuid()');
                console.log('   ✅ Added UUID id column');
            } catch (error) {
                if (error.message.includes('already exists')) {
                    console.log('   ⚠️  UUID id column already exists');
                } else {
                    throw error;
                }
            }
            
            // Update any NULL UUIDs
            const updateResult = await client.query('UPDATE "finishOptions" SET id = gen_random_uuid() WHERE id IS NULL');
            console.log(`   ✅ Updated ${updateResult.rowCount} NULL UUIDs`);
            
            // Set as primary key
            try {
                await client.query('ALTER TABLE "finishOptions" ADD PRIMARY KEY (id)');
                console.log('   ✅ Set UUID primary key');
            } catch (error) {
                console.log(`   ⚠️  Primary key: ${error.message}`);
            }
            
        } else {
            console.log(`   ✅ Primary key exists on: ${primaryKey.rows.map(r => r.column_name).join(', ')}`);
        }
        
        console.log('\n3. Checking for firestore_id column...');
        
        const firestoreIdExists = currentStructure.rows.find(col => col.column_name === 'firestore_id');
        
        if (firestoreIdExists) {
            console.log('   Found firestore_id column, renaming to finish_option_id...');
            
            try {
                await client.query('ALTER TABLE "finishOptions" RENAME COLUMN firestore_id TO finish_option_id');
                console.log('   ✅ Renamed firestore_id to finish_option_id');
            } catch (error) {
                console.log(`   ⚠️  Rename column: ${error.message}`);
            }
        } else {
            console.log('   ✅ No firestore_id column found (already renamed or doesn\'t exist)');
        }
        
        console.log('\n4. Adding timestamps if missing...');
        
        const hasCreatedAt = currentStructure.rows.find(col => col.column_name === 'created_at');
        const hasUpdatedAt = currentStructure.rows.find(col => col.column_name === 'updated_at');
        
        if (!hasCreatedAt) {
            await client.query('ALTER TABLE "finishOptions" ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW()');
            console.log('   ✅ Added created_at column');
        }
        
        if (!hasUpdatedAt) {
            await client.query('ALTER TABLE "finishOptions" ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW()');
            console.log('   ✅ Added updated_at column');
        }
        
        console.log('\n5. Creating indexes...');
        
        // Create index on finish_option_id if it exists
        const hasFinishOptionId = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'finishOptions' AND column_name = 'finish_option_id'
        `);
        
        if (hasFinishOptionId.rows.length > 0) {
            try {
                await client.query('CREATE INDEX IF NOT EXISTS idx_finishOptions_finish_option_id ON "finishOptions" (finish_option_id)');
                console.log('   ✅ Created index on finish_option_id');
            } catch (error) {
                console.log(`   ⚠️  Index on finish_option_id: ${error.message}`);
            }
        }
        
        console.log('\n6. Final verification...');
        
        // Get final structure
        const finalStructure = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'finishOptions' 
            ORDER BY ordinal_position
        `);
        
        console.log('Final structure:');
        finalStructure.rows.forEach(col => {
            console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'}) ${col.column_default ? `default: ${col.column_default}` : ''}`);
        });
        
        // Count records
        const recordCount = await client.query('SELECT COUNT(*) FROM "finishOptions"');
        console.log(`\n✅ finishOptions table successfully fixed with ${recordCount.rows[0].count} records!`);
        
        client.release();
        
    } catch (error) {
        console.error('Error fixing finishOptions:', error);
    } finally {
        await pool.end();
    }
}

fixFinishOptions();
