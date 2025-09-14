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

async function fixRemainingTables() {
    try {
        const client = await pool.connect();
        
        console.log('=== FIXING REMAINING TABLES ===\n');
        
        console.log('1. Fixing tables without proper UUID primary keys...');
        
        // List of tables that still need UUID primary key fixes
        const tablesToFix = [
            { name: 'backups', hasData: false },
            { name: 'finishOptions', hasData: true },
            { name: 'pricingRules', hasData: true },
            { name: 'services', hasData: true }
        ];
        
        for (const table of tablesToFix) {
            console.log(`\n   Processing ${table.name}...`);
            
            if (!table.hasData) {
                // For empty tables, just recreate with proper structure
                console.log(`     - Table ${table.name} appears empty, recreating structure...`);
                
                // Get current table structure
                const columns = await client.query(`
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns
                    WHERE table_name = $1 AND table_schema = 'public'
                    ORDER BY ordinal_position
                `, [table.name]);
                
                if (columns.rows.length > 0) {
                    // Drop and recreate with UUID primary key
                    await client.query(`DROP TABLE IF EXISTS "${table.name}" CASCADE`);
                    
                    let createSql = `CREATE TABLE "${table.name}" (\n`;
                    createSql += `    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n`;
                    
                    for (const col of columns.rows) {
                        if (col.column_name !== 'id' && col.column_name !== 'firestore_id') {
                            const nullable = col.is_nullable === 'YES' ? '' : ' NOT NULL';
                            const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
                            createSql += `    ${col.column_name} ${col.data_type}${nullable}${defaultVal},\n`;
                        }
                    }
                    
                    // Add firestore_id as regular column for reference
                    createSql += `    firestore_id TEXT,\n`;
                    createSql += `    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n`;
                    createSql += `    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n`;
                    createSql += `)`;
                    
                    await client.query(createSql);
                    console.log(`     ✅ Recreated ${table.name} with UUID primary key`);
                }
            } else {
                // For tables with data, do careful migration
                console.log(`     - Table ${table.name} has data, performing careful migration...`);
                
                // Check current id column type
                const idInfo = await client.query(`
                    SELECT data_type 
                    FROM information_schema.columns 
                    WHERE table_name = $1 AND column_name = 'id'
                `, [table.name]);
                
                if (idInfo.rows[0]?.data_type !== 'uuid') {
                    // Add UUID column and migrate
                    try {
                        await client.query(`ALTER TABLE "${table.name}" ADD COLUMN new_id UUID DEFAULT gen_random_uuid()`);
                        await client.query(`UPDATE "${table.name}" SET new_id = gen_random_uuid() WHERE new_id IS NULL`);
                        
                        // Drop old primary key and set new one
                        await client.query(`ALTER TABLE "${table.name}" DROP CONSTRAINT IF EXISTS ${table.name}_pkey`);
                        await client.query(`ALTER TABLE "${table.name}" DROP COLUMN IF EXISTS id`);
                        await client.query(`ALTER TABLE "${table.name}" RENAME COLUMN new_id TO id`);
                        await client.query(`ALTER TABLE "${table.name}" ADD PRIMARY KEY (id)`);
                        
                        console.log(`     ✅ Converted ${table.name} to UUID primary key`);
                    } catch (error) {
                        console.log(`     ❌ Error converting ${table.name}: ${error.message}`);
                    }
                } else {
                    console.log(`     ✅ ${table.name} already has UUID primary key`);
                }
            }
        }
        
        console.log('\n2. Cleaning up remaining firestore_id columns...');
        
        // For tables that still have firestore_id, keep them but ensure they're indexed
        const firestoreIdTables = ['profiles', 'quotes', 'pricing_rules'];
        
        for (const tableName of firestoreIdTables) {
            try {
                // Ensure firestore_id has unique index
                await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_${tableName}_firestore_id ON "${tableName}" (firestore_id)`);
                console.log(`   ✅ Created unique index on ${tableName}.firestore_id`);
            } catch (error) {
                console.log(`   ⚠️  Index on ${tableName}.firestore_id: ${error.message}`);
            }
        }
        
        console.log('\n3. Ensuring all tables have proper timestamps...');
        
        const allTables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);
        
        for (const table of allTables.rows) {
            // Check if table has created_at and updated_at
            const hasTimestamps = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = $1 
                AND column_name IN ('created_at', 'updated_at')
            `, [table.table_name]);
            
            if (hasTimestamps.rows.length < 2) {
                try {
                    if (!hasTimestamps.rows.find(r => r.column_name === 'created_at')) {
                        await client.query(`ALTER TABLE "${table.table_name}" ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
                    }
                    if (!hasTimestamps.rows.find(r => r.column_name === 'updated_at')) {
                        await client.query(`ALTER TABLE "${table.table_name}" ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
                    }
                    console.log(`   ✅ Added timestamps to ${table.table_name}`);
                } catch (error) {
                    console.log(`   ⚠️  Timestamps for ${table.table_name}: ${error.message}`);
                }
            }
        }
        
        console.log('\n✅ Remaining tables cleanup completed!');
        
        client.release();
        
    } catch (error) {
        console.error('Error fixing remaining tables:', error);
    } finally {
        await pool.end();
    }
}

fixRemainingTables();
