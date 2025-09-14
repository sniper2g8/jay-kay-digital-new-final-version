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

async function standardizeDatabase() {
    try {
        const client = await pool.connect();
        
        console.log('=== STANDARDIZING DATABASE TO SUPABASE FORMAT ===\n');
        
        // Enable UUID extension if not already enabled
        await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        console.log('✅ UUID extension enabled');
        
        console.log('\n1. Standardizing human_id fields in appUsers...');
        
        // Check current humanID fields
        const humanIdCheck = await client.query(`
            SELECT 
                COUNT(*) as total,
                COUNT("humanID") as has_humanID,
                COUNT("humanId") as has_humanId
            FROM "appUsers"
        `);
        
        console.log(`   Total users: ${humanIdCheck.rows[0].total}`);
        console.log(`   With humanID: ${humanIdCheck.rows[0].has_humanid}`);
        console.log(`   With humanId: ${humanIdCheck.rows[0].has_humanid}`);
        
        // Add human_id column and merge the values
        await client.query('ALTER TABLE "appUsers" ADD COLUMN IF NOT EXISTS human_id TEXT');
        
        await client.query(`
            UPDATE "appUsers" 
            SET human_id = COALESCE("humanID", "humanId")
            WHERE human_id IS NULL
        `);
        
        // Drop the old columns
        await client.query('ALTER TABLE "appUsers" DROP COLUMN IF EXISTS "humanID"');
        await client.query('ALTER TABLE "appUsers" DROP COLUMN IF EXISTS "humanId"');
        console.log('   ✅ Merged humanID/humanId into human_id');
        
        console.log('\n2. Adding UUID primary keys to all tables...');
        
        const tables = ['appUsers', 'counters', 'finishOptions', 'invoices', 'jobs', 
                       'notification_preferences', 'services', 'settings', 'customers'];
        
        // Create mapping tables to store old firestore_id -> new UUID relationships
        console.log('   Creating ID mapping tables...');
        for (const table of tables) {
            try {
                await client.query(`
                    CREATE TABLE IF NOT EXISTS "${table}_id_mapping" (
                        old_firestore_id TEXT,
                        new_uuid UUID DEFAULT gen_random_uuid(),
                        PRIMARY KEY (old_firestore_id)
                    )
                `);
                
                // Populate mapping table
                await client.query(`
                    INSERT INTO "${table}_id_mapping" (old_firestore_id)
                    SELECT DISTINCT firestore_id 
                    FROM "${table}" 
                    WHERE firestore_id IS NOT NULL
                    ON CONFLICT (old_firestore_id) DO NOTHING
                `);
                
                console.log(`     ✅ Created mapping for ${table}`);
            } catch (error) {
                console.log(`     ❌ Error creating mapping for ${table}: ${error.message}`);
            }
        }
        
        console.log('\n3. Adding new UUID columns and updating data...');
        
        for (const table of tables) {
            try {
                // Add new UUID column
                await client.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS id UUID`);
                
                // Update with mapped UUIDs
                await client.query(`
                    UPDATE "${table}" 
                    SET id = mapping.new_uuid
                    FROM "${table}_id_mapping" mapping
                    WHERE "${table}".firestore_id = mapping.old_firestore_id
                `);
                
                console.log(`     ✅ Added UUID column to ${table}`);
            } catch (error) {
                console.log(`     ❌ Error adding UUID to ${table}: ${error.message}`);
            }
        }
        
        console.log('\n4. Handling special cases for tables with serial keys...');
        
        // Handle pricingRules and invoice_payments which have serial keys
        const serialTables = ['pricingRules', 'invoice_payments'];
        
        for (const table of serialTables) {
            try {
                await client.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid()`);
                console.log(`     ✅ Added UUID column to ${table}`);
            } catch (error) {
                console.log(`     ❌ Error adding UUID to ${table}: ${error.message}`);
            }
        }
        
        console.log('\n5. Creating foreign key reference mapping tables...');
        
        // Create reference mapping for foreign keys
        const foreignKeyMappings = [
            { table: 'jobs', column: 'customerId', refTable: 'customers' },
            { table: 'jobs', column: 'serviceId', refTable: 'services' },
            { table: 'jobs', column: 'invoiceId', refTable: 'invoices' },
            { table: 'invoices', column: 'customerId', refTable: 'customers' },
            { table: 'pricingRules', column: 'serviceId', refTable: 'services' }
        ];
        
        for (const mapping of foreignKeyMappings) {
            try {
                // Add new UUID foreign key columns
                await client.query(`ALTER TABLE "${mapping.table}" ADD COLUMN IF NOT EXISTS ${mapping.column.replace('Id', '_id')} UUID`);
                
                // Update with mapped UUIDs
                await client.query(`
                    UPDATE "${mapping.table}" 
                    SET ${mapping.column.replace('Id', '_id')} = ref_mapping.new_uuid
                    FROM "${mapping.refTable}_id_mapping" ref_mapping
                    WHERE "${mapping.table}"."${mapping.column}" = ref_mapping.old_firestore_id
                `);
                
                console.log(`     ✅ Updated ${mapping.table}.${mapping.column} references`);
            } catch (error) {
                console.log(`     ❌ Error updating ${mapping.table}.${mapping.column}: ${error.message}`);
            }
        }
        
        // Handle invoice_payments special case
        try {
            await client.query('ALTER TABLE "invoice_payments" ADD COLUMN IF NOT EXISTS invoice_uuid UUID');
            await client.query(`
                UPDATE "invoice_payments" 
                SET invoice_uuid = mapping.new_uuid
                FROM "invoices_id_mapping" mapping
                WHERE "invoice_payments".invoice_id = mapping.old_firestore_id
            `);
            console.log('     ✅ Updated invoice_payments.invoice_id references');
        } catch (error) {
            console.log(`     ❌ Error updating invoice_payments: ${error.message}`);
        }
        
        client.release();
        console.log('\n✅ Phase 1 complete - UUID columns added and populated!');
        
    } catch (error) {
        console.error('Error in phase 1:', error);
    } finally {
        await pool.end();
    }
}

standardizeDatabase();
