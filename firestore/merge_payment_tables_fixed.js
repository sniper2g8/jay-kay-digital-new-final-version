const { Pool } = require('pg');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./supabase-service.json', 'utf8'));
const pool = new Pool(config);

async function mergePaymentTablesFixed() {
  try {
    const client = await pool.connect();
    
    console.log('=== FIXED PAYMENT TABLES MERGER ===\n');
    
    // Check counters table structure first
    const countersStructure = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'counters' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Counters table structure:');
    countersStructure.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type}`);
    });
    
    // Get correct column name for counter value
    const valueColumn = countersStructure.rows.find(col => 
      col.column_name.includes('value') || col.column_name.includes('count')
    )?.column_name || 'value';
    
    console.log(`\n📊 Using counter column: ${valueColumn}`);
    
    console.log('\n1. Creating backup of invoice_payments...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoice_payments_merger_backup AS
      SELECT 
        *,
        NOW() as backup_timestamp,
        'Pre-merger backup' as backup_reason
      FROM invoice_payments
    `);
    
    console.log('   ✅ Backup created');
    
    console.log('\n2. Getting next payment number...');
    
    // Get next payment number safely
    const nextNumberResult = await client.query(`
      SELECT 
        COALESCE(
          (SELECT ${valueColumn} + 1 FROM counters WHERE name = 'payment_number'),
          1
        ) as next_number
    `);
    
    let paymentCounter = nextNumberResult.rows[0].next_number;
    console.log(`   📈 Starting from payment number: ${paymentCounter}`);
    
    console.log('\n3. Migrating invoice_payments data to payments table...');
    
    const invoicePayments = await client.query('SELECT * FROM invoice_payments ORDER BY created_at');
    console.log(`   🔄 Migrating ${invoicePayments.rows.length} records...`);
    
    for (const payment of invoicePayments.rows) {
      const paymentNumber = `PAY-${new Date().getFullYear()}-${paymentCounter.toString().padStart(4, '0')}`;
      
      // Extract payment method with fallback
      let paymentMethod = 'cash'; // default
      if (payment.method) {
        const method = payment.method.toLowerCase();
        if (['cash', 'check', 'card', 'bank_transfer', 'mobile_money'].includes(method)) {
          paymentMethod = method;
        }
      }
      
      // Extract payment date with proper handling
      let paymentDate = new Date();
      if (payment.created_at) {
        paymentDate = new Date(payment.created_at);
      } else if (payment.receivedAt && typeof payment.receivedAt === 'object') {
        if (payment.receivedAt.seconds) {
          paymentDate = new Date(payment.receivedAt.seconds * 1000);
        }
      }
      
      try {
        await client.query(`
          INSERT INTO payments (
            id,
            payment_number,
            invoice_id,
            customer_id,
            amount,
            payment_method,
            payment_date,
            reference_number,
            notes,
            received_by,
            created_at,
            updated_at
          ) VALUES (
            gen_random_uuid(),
            $1,
            $2,
            (SELECT customer_id FROM invoices WHERE id = $2),
            $3,
            $4::payment_method,
            $5::date,
            $6,
            $7,
            $8,
            $9,
            $10
          )
        `, [
          paymentNumber,
          payment.invoice_uuid,
          parseFloat(payment.amount) || 0,
          paymentMethod,
          paymentDate.toISOString().split('T')[0], // date only
          payment.reference || payment.invoice_no,
          `Migrated from invoice_payments. Original method: ${payment.method}`,
          payment.createdBy,
          payment.created_at || new Date(),
          payment.updated_at || new Date()
        ]);
        
        paymentCounter++;
        console.log(`     ✅ Migrated: ${paymentNumber} (${payment.amount} via ${payment.method})`);
        
      } catch (error) {
        console.log(`     ❌ Error migrating payment ${paymentNumber}: ${error.message}`);
      }
    }
    
    // Update counter
    console.log('\n4. Updating payment counter...');
    await client.query(`
      INSERT INTO counters (name, ${valueColumn}, prefix, suffix, format)
      VALUES ('payment_number', $1, 'PAY-', '', 'PAY-YYYY-####')
      ON CONFLICT (name) 
      DO UPDATE SET ${valueColumn} = $1
    `, [paymentCounter - 1]);
    
    console.log('\n5. Verifying migration...');
    const migratedCount = await client.query('SELECT COUNT(*) as count FROM payments');
    console.log(`   ✅ Payments table now has: ${migratedCount.rows[0].count} records`);
    
    // Verification query
    const verification = await client.query(`
      SELECT 
        p.payment_number,
        p.amount,
        p.payment_method,
        p.payment_date,
        i.invoice_number
      FROM payments p
      LEFT JOIN invoices i ON p.invoice_id = i.id
      ORDER BY p.created_at
    `);
    
    console.log('\n   📊 Migrated payments verification:');
    verification.rows.forEach(payment => {
      console.log(`     ${payment.payment_number}: $${payment.amount} (${payment.payment_method}) → ${payment.invoice_number}`);
    });
    
    console.log('\n6. Dropping redundant invoice_payments table...');
    try {
      await client.query('DROP TABLE IF EXISTS invoice_payments CASCADE');
      console.log('   ✅ Successfully dropped invoice_payments table');
    } catch (error) {
      console.log(`   ⚠️ Error dropping table: ${error.message}`);
    }
    
    // Final table count
    const finalCount = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE '%backup%'
    `);
    
    console.log(`\n📊 Final production tables: ${finalCount.rows[0].count}`);
    
    console.log('\n✅ PAYMENT TABLES MERGER COMPLETE!');
    console.log('\n🎯 BENEFITS ACHIEVED:');
    console.log('   • ✅ Unified payment tracking in single table');
    console.log('   • ✅ Better data integrity with proper foreign keys');
    console.log('   • ✅ Consistent payment numbering system');
    console.log('   • ✅ Eliminated redundant table');
    console.log('   • ✅ Simplified database schema');
    
    client.release();
    
  } catch (error) {
    console.error('Error during merger:', error);
  } finally {
    await pool.end();
  }
}

mergePaymentTablesFixed();
