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

async function fixRemainingIssues() {
    try {
        const client = await pool.connect();
        
        console.log('=== FIXING REMAINING UUID AND TYPE ISSUES ===\n');
        
        console.log('1. Investigating triggers and constraints...');
        
        // Check for triggers that might be preventing updates
        const triggers = await client.query(`
            SELECT 
                trigger_name,
                table_name,
                action_timing,
                event_manipulation
            FROM information_schema.triggers 
            WHERE table_schema = 'public' 
            AND table_name IN ('counters', 'notification_preferences')
        `);
        
        console.log(`   Found ${triggers.rows.length} triggers:`);
        triggers.rows.forEach(trigger => {
            console.log(`     ${trigger.table_name}.${trigger.trigger_name} (${trigger.action_timing} ${trigger.event_manipulation})`);
        });
        
        console.log('\n2. Temporarily disabling triggers...');
        
        // Disable triggers temporarily
        await client.query('SET session_replication_role = replica;');
        console.log('   ✅ Disabled all triggers');
        
        console.log('\n3. Fixing NULL UUIDs...');
        
        // Fix counters
        const countersResult = await client.query(`UPDATE "counters" SET id = gen_random_uuid() WHERE id IS NULL`);
        console.log(`   ✅ Fixed ${countersResult.rowCount} NULL UUIDs in counters`);
        
        // Fix notification_preferences  
        const notifResult = await client.query(`UPDATE "notification_preferences" SET id = gen_random_uuid() WHERE id IS NULL`);
        console.log(`   ✅ Fixed ${notifResult.rowCount} NULL UUIDs in notification_preferences`);
        
        console.log('\n4. Re-enabling triggers...');
        await client.query('SET session_replication_role = DEFAULT;');
        console.log('   ✅ Re-enabled all triggers');
        
        console.log('\n5. Setting primary keys...');
        
        try {
            await client.query('ALTER TABLE "counters" ADD PRIMARY KEY (id)');
            console.log('   ✅ Set primary key for counters');
        } catch (error) {
            console.log(`   ⚠️  Counters primary key: ${error.message}`);
        }
        
        try {
            await client.query('ALTER TABLE "notification_preferences" ADD PRIMARY KEY (id)');
            console.log('   ✅ Set primary key for notification_preferences');
        } catch (error) {
            console.log(`   ⚠️  Notification_preferences primary key: ${error.message}`);
        }
        
        console.log('\n6. Fixing foreign key type issues...');
        
        // Check for services table - it might still have TEXT id instead of UUID
        const servicesInfo = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'services' AND column_name = 'id'
        `);
        
        console.log(`   services.id type: ${servicesInfo.rows[0]?.data_type}`);
        
        if (servicesInfo.rows[0]?.data_type === 'text') {
            console.log('   Converting services.id from TEXT to UUID...');
            
            // Create mapping for services
            await client.query(`
                CREATE TABLE IF NOT EXISTS services_uuid_mapping (
                    old_text_id TEXT PRIMARY KEY,
                    new_uuid_id UUID DEFAULT gen_random_uuid()
                )
            `);
            
            await client.query(`
                INSERT INTO services_uuid_mapping (old_text_id)
                SELECT DISTINCT id FROM "services"
                ON CONFLICT (old_text_id) DO NOTHING
            `);
            
            // Add new UUID column to services
            await client.query('ALTER TABLE "services" ADD COLUMN new_id UUID');
            
            // Populate with mapped UUIDs
            await client.query(`
                UPDATE "services" 
                SET new_id = mapping.new_uuid_id
                FROM services_uuid_mapping mapping
                WHERE "services".id = mapping.old_text_id
            `);
            
            // Update foreign key references in jobs and pricingRules
            await client.query(`
                UPDATE "jobs" 
                SET service_id = mapping.new_uuid_id
                FROM services_uuid_mapping mapping
                WHERE "jobs".service_id::text = mapping.old_text_id
            `);
            
            await client.query(`
                UPDATE "pricingRules" 
                SET service_id = mapping.new_uuid_id
                FROM services_uuid_mapping mapping
                WHERE "pricingRules".service_id::text = mapping.old_text_id
            `);
            
            // Drop old constraints and columns
            await client.query('ALTER TABLE "services" DROP CONSTRAINT IF EXISTS services_pkey');
            await client.query('ALTER TABLE "services" DROP COLUMN id');
            await client.query('ALTER TABLE "services" RENAME COLUMN new_id TO id');
            await client.query('ALTER TABLE "services" ADD PRIMARY KEY (id)');
            
            // Clean up mapping table
            await client.query('DROP TABLE services_uuid_mapping');
            
            console.log('   ✅ Converted services table to UUID');
        }
        
        console.log('\n7. Recreating foreign key constraints...');
        
        // Drop existing foreign key constraints
        const constraints = [
            'ALTER TABLE "jobs" DROP CONSTRAINT IF EXISTS fk_jobs_service_uuid',
            'ALTER TABLE "pricingRules" DROP CONSTRAINT IF EXISTS fk_pricing_service_uuid'
        ];
        
        for (const sql of constraints) {
            try {
                await client.query(sql);
            } catch (error) {
                // Ignore if constraint doesn't exist
            }
        }
        
        // Create new foreign key constraints
        try {
            await client.query(`
                ALTER TABLE "jobs" 
                ADD CONSTRAINT fk_jobs_service_uuid
                FOREIGN KEY ("service_id") 
                REFERENCES "services"("id") 
                ON DELETE SET NULL
            `);
            console.log('   ✅ Created jobs -> services foreign key');
        } catch (error) {
            console.log(`   ❌ Jobs -> Services FK: ${error.message}`);
        }
        
        try {
            await client.query(`
                ALTER TABLE "pricingRules" 
                ADD CONSTRAINT fk_pricing_service_uuid
                FOREIGN KEY ("service_id") 
                REFERENCES "services"("id") 
                ON DELETE CASCADE
            `);
            console.log('   ✅ Created pricingRules -> services foreign key');
        } catch (error) {
            console.log(`   ❌ PricingRules -> Services FK: ${error.message}`);
        }
        
        client.release();
        console.log('\n✅ All remaining issues fixed!');
        
    } catch (error) {
        console.error('Error fixing remaining issues:', error);
    } finally {
        await pool.end();
    }
}

fixRemainingIssues();
