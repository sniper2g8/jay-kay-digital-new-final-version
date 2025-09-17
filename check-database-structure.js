const { Client } = require('pg');

async function checkDatabaseStructure() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres.vkitlmjmtlktclcabjsg:Magics123@aws-0-eu-central-1.pooler.supabase.com:6543/postgres'
    });

    try {
        await client.connect();
        console.log('Connected to database successfully');

        // Check all tables in the public schema
        console.log('\n=== EXISTING TABLES ===');
        const tablesResult = await client.query(`
            SELECT table_name, table_type 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);
        
        tablesResult.rows.forEach(row => {
            console.log(`${row.table_name} (${row.table_type})`);
        });

        // Check if our required tables exist
        const requiredTables = ['audit_logs', 'backup_logs', 'backup_schedules', 'system_settings'];
        
        console.log('\n=== MISSING TABLES CHECK ===');
        for (const tableName of requiredTables) {
            const tableExists = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = $1
                );
            `, [tableName]);
            
            const exists = tableExists.rows[0].exists;
            console.log(`${tableName}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
        }

        // Check existing table structures for key tables
        const keyTables = ['customers', 'jobs', 'invoices', 'appUsers'];
        
        for (const tableName of keyTables) {
            console.log(`\n=== ${tableName.toUpperCase()} TABLE STRUCTURE ===`);
            try {
                const columnsResult = await client.query(`
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = $1
                    ORDER BY ordinal_position;
                `, [tableName]);
                
                if (columnsResult.rows.length > 0) {
                    columnsResult.rows.forEach(col => {
                        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
                    });
                } else {
                    console.log(`  ❌ Table ${tableName} does not exist`);
                }
            } catch (error) {
                console.log(`  ❌ Error checking ${tableName}: ${error.message}`);
            }
        }

        // Check for foreign key constraints
        console.log('\n=== FOREIGN KEY CONSTRAINTS ===');
        const constraintsResult = await client.query(`
            SELECT
                tc.table_name,
                tc.constraint_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM
                information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND tc.table_schema = 'public'
            ORDER BY tc.table_name, tc.constraint_name;
        `);

        constraintsResult.rows.forEach(row => {
            console.log(`${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`);
        });

    } catch (error) {
        console.error('Database connection error:', error);
    } finally {
        await client.end();
    }
}

checkDatabaseStructure();