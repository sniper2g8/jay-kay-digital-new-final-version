const { Pool } = require('pg');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./supabase-service.json', 'utf8'));
const pool = new Pool(config);

async function updatePaymentInvoiceReference() {
  try {
    const client = await pool.connect();
    
    console.log('=== UPDATING PAYMENT.INVOICE_ID TO INVOICE_NO ===\n');
    
    console.log('1. Analyzing current payment structure...');
    
    // Check current payments table structure
    const paymentsStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'payments' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('   📋 Current payments table structure:');
    paymentsStructure.rows.forEach(col => {
      console.log(`   ${col.column_name.padEnd(20)} ${col.data_type.padEnd(15)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check current payments data
    const currentPayments = await client.query(`
      SELECT 
        p.payment_number,
        p.invoice_id,
        i.invoiceNo as current_invoice_no,
        p.amount
      FROM payments p
      LEFT JOIN invoices i ON p.invoice_id = i.id
      LIMIT 5
    `);
    
    console.log('\n   📊 Current payment-invoice relationships:');
    currentPayments.rows.forEach(payment => {
      console.log(`   ${payment.payment_number}: ${payment.invoice_id} → ${payment.current_invoice_no} ($${payment.amount})`);
    });
    
    console.log('\n2. Creating backup before modification...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments_invoice_reference_backup AS
      SELECT 
        *,
        NOW() as backup_timestamp,
        'Before changing invoice_id to invoice_no reference' as backup_reason
      FROM payments
    `);
    
    const backupCount = await client.query('SELECT COUNT(*) as count FROM payments_invoice_reference_backup');
    console.log(`   ✅ Backup created: ${backupCount.rows[0].count} records`);
    
    console.log('\n3. Adding invoice_no column to payments table...');
    
    // Add invoice_no column
    try {
      await client.query(`
        ALTER TABLE payments 
        ADD COLUMN IF NOT EXISTS invoice_no VARCHAR(50)
      `);
      console.log('   ✅ Added invoice_no column');
    } catch (error) {
      console.log(`   ℹ️ invoice_no column might already exist: ${error.message}`);
    }
    
    console.log('\n4. Populating invoice_no from invoice_id relationships...');
    
    // Update invoice_no with actual invoice numbers
    const updateResult = await client.query(`
      UPDATE payments 
      SET invoice_no = i.invoiceNo
      FROM invoices i
      WHERE payments.invoice_id = i.id
      AND payments.invoice_no IS NULL
    `);
    
    console.log(`   ✅ Updated ${updateResult.rowCount} payment records with invoice numbers`);
    
    console.log('\n5. Verifying the update...');
    
    const verificationQuery = await client.query(`
      SELECT 
        p.payment_number,
        p.invoice_id,
        p.invoice_no,
        p.amount,
        i.invoiceNo as original_invoice_no
      FROM payments p
      LEFT JOIN invoices i ON p.invoice_id = i.id
      ORDER BY p.created_at
    `);
    
    console.log('   📊 Verification (invoice_no populated):');
    verificationQuery.rows.forEach(payment => {
      const match = payment.invoice_no === payment.original_invoice_no ? '✅' : '❌';
      console.log(`   ${match} ${payment.payment_number}: invoice_no="${payment.invoice_no}" (matches: ${payment.original_invoice_no})`);
    });
    
    console.log('\n6. Adding index for better performance...');
    
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_payments_invoice_no 
        ON payments(invoice_no)
      `);
      console.log('   ✅ Added index on payments.invoice_no');
    } catch (error) {
      console.log(`   ℹ️ Index might already exist: ${error.message}`);
    }
    
    console.log('\n7. Frontend-friendly query examples...');
    
    // Show examples of easier frontend queries
    console.log('\n   🎯 NEW FRONTEND QUERIES (much easier):');
    console.log(`
    // Get payments for invoice JKDP-INV-0001
    const payments = await supabase
      .from("payments")
      .select("*")
      .eq("invoice_no", "JKDP-INV-0001")
    `);
    
    console.log(`
    // Get payment with invoice details (no complex joins)
    const paymentWithInvoice = await supabase
      .from("payments")
      .select("payment_number, amount, invoice_no, payment_date")
      .eq("payment_number", "PAY-2025-0001")
    `);
    
    console.log('\n   📋 BEFORE (complex UUID joins):');
    console.log('   invoice_id: "d05a5002-33f2-4219-9d1b-236d23328af2"');
    console.log(`
    // Had to join tables to get readable invoice number
    const paymentsOld = await supabase
      .from("payments")
      .select("*, invoices(invoiceNo)")
      .eq("invoice_id", uuid)
    `);
    
    console.log('\n   📋 AFTER (simple string references):');
    console.log('   invoice_no: "JKDP-INV-0004"');
    console.log(`
    // Direct query with readable invoice number
    const paymentsNew = await supabase
      .from("payments")
      .select("*")
      .eq("invoice_no", "JKDP-INV-0004")
    `);
    
    console.log('\n8. Optional: Keeping invoice_id for referential integrity...');
    console.log('   💡 RECOMMENDATION: Keep both columns');
    console.log('   • invoice_id (UUID): For foreign key relationships and data integrity');
    console.log('   • invoice_no (string): For frontend queries and user-friendly references');
    console.log('   • This gives you the best of both worlds!');
    
    // Check if we should add foreign key constraint
    const fkConstraints = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints 
      WHERE table_name = 'payments' 
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%invoice%'
    `);
    
    console.log(`\n   🔗 Current foreign key constraints: ${fkConstraints.rows.length}`);
    fkConstraints.rows.forEach(fk => {
      console.log(`     ${fk.constraint_name}`);
    });
    
    console.log('\n✅ PAYMENT INVOICE REFERENCE UPDATE COMPLETE!');
    console.log('\n🎯 BENEFITS FOR FRONTEND DEVELOPMENT:');
    console.log('   ✅ Human-readable invoice references');
    console.log('   ✅ Simpler queries without UUID lookups');
    console.log('   ✅ Better user experience (show JKDP-INV-0004 instead of UUID)');
    console.log('   ✅ Easier debugging and development');
    console.log('   ✅ Maintains data integrity with dual reference system');
    
    console.log('\n📋 FRONTEND USAGE:');
    console.log('   • Use invoice_no for display and queries');
    console.log('   • Keep invoice_id for backend relationships');
    console.log('   • Index on invoice_no ensures fast queries');
    console.log('   • Backup preserved for safety');
    
    console.log('\n🚀 READY FOR NEXT.JS DEVELOPMENT!');
    
    client.release();
    
  } catch (error) {
    console.error('Error updating payment invoice reference:', error);
  } finally {
    await pool.end();
  }
}

updatePaymentInvoiceReference();
