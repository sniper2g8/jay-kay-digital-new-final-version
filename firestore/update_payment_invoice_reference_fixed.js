const { Pool } = require('pg');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./supabase-service.json', 'utf8'));
const pool = new Pool(config);

async function updatePaymentInvoiceReferenceFixed() {
  try {
    const client = await pool.connect();
    
    console.log('=== UPDATING PAYMENT INVOICE REFERENCE (FIXED) ===\n');
    
    console.log('1. Checking invoice table structure...');
    
    // Check actual column names in invoices table
    const invoiceColumns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'invoices' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('   📋 Invoices table columns:');
    invoiceColumns.rows.forEach(col => {
      console.log(`   ${col.column_name.padEnd(20)} ${col.data_type}`);
    });
    
    // Find the correct invoice number column
    const invoiceNumberColumn = invoiceColumns.rows.find(col => 
      col.column_name.toLowerCase().includes('invoice') && 
      col.column_name.toLowerCase().includes('no')
    )?.column_name || 'invoiceNo';
    
    console.log(`\n   🎯 Using invoice number column: ${invoiceNumberColumn}`);
    
    console.log('\n2. Analyzing current payment structure...');
    
    // Check current payments data with correct column name
    const currentPayments = await client.query(`
      SELECT 
        p.payment_number,
        p.invoice_id,
        i."${invoiceNumberColumn}" as current_invoice_no,
        p.amount
      FROM payments p
      LEFT JOIN invoices i ON p.invoice_id = i.id
      LIMIT 5
    `);
    
    console.log('   📊 Current payment-invoice relationships:');
    currentPayments.rows.forEach(payment => {
      console.log(`   ${payment.payment_number}: ${payment.invoice_id} → ${payment.current_invoice_no} ($${payment.amount})`);
    });
    
    console.log('\n3. Creating backup...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments_invoice_no_backup AS
      SELECT 
        *,
        NOW() as backup_timestamp,
        'Before adding invoice_no column' as backup_reason
      FROM payments
    `);
    console.log('   ✅ Backup created');
    
    console.log('\n4. Adding invoice_no column...');
    
    try {
      await client.query(`
        ALTER TABLE payments 
        ADD COLUMN IF NOT EXISTS invoice_no VARCHAR(50)
      `);
      console.log('   ✅ Added invoice_no column');
    } catch (error) {
      console.log(`   ℹ️ Column might exist: ${error.message}`);
    }
    
    console.log('\n5. Populating invoice_no with actual invoice numbers...');
    
    // Update with correct column name
    const updateResult = await client.query(`
      UPDATE payments 
      SET invoice_no = i."${invoiceNumberColumn}"
      FROM invoices i
      WHERE payments.invoice_id = i.id
      AND payments.invoice_no IS NULL
    `);
    
    console.log(`   ✅ Updated ${updateResult.rowCount} payment records`);
    
    console.log('\n6. Verifying the update...');
    
    const verification = await client.query(`
      SELECT 
        p.payment_number,
        p.invoice_id,
        p.invoice_no,
        p.amount,
        i."${invoiceNumberColumn}" as original_invoice_no
      FROM payments p
      LEFT JOIN invoices i ON p.invoice_id = i.id
      ORDER BY p.created_at
    `);
    
    console.log('   📊 Verification results:');
    verification.rows.forEach(payment => {
      const match = payment.invoice_no === payment.original_invoice_no ? '✅' : '❌';
      console.log(`   ${match} ${payment.payment_number}: "${payment.invoice_no}" (${payment.original_invoice_no})`);
    });
    
    console.log('\n7. Adding performance index...');
    
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_payments_invoice_no 
        ON payments(invoice_no)
      `);
      console.log('   ✅ Added index on payments.invoice_no');
    } catch (error) {
      console.log(`   ℹ️ Index exists: ${error.message}`);
    }
    
    console.log('\n8. Testing frontend-friendly queries...');
    
    // Test the new query capability
    const testQuery = await client.query(`
      SELECT payment_number, amount, invoice_no, payment_method
      FROM payments 
      WHERE invoice_no IS NOT NULL
      LIMIT 3
    `);
    
    console.log('   🧪 Test query results:');
    testQuery.rows.forEach(payment => {
      console.log(`   ${payment.payment_number}: $${payment.amount} for ${payment.invoice_no} (${payment.payment_method})`);
    });
    
    console.log('\n✅ PAYMENT INVOICE REFERENCE UPDATE COMPLETE!');
    
    console.log('\n🎯 FRONTEND BENEFITS:');
    console.log('   ✅ Human-readable invoice references (JKDP-INV-0004 vs UUIDs)');
    console.log('   ✅ Simpler queries without complex joins');
    console.log('   ✅ Better user experience and debugging');
    console.log('   ✅ Faster queries with dedicated index');
    
    console.log('\n📋 FRONTEND USAGE EXAMPLES:');
    console.log('\n   // Get all payments for a specific invoice');
    console.log('   const payments = await supabase');
    console.log('     .from("payments")');
    console.log('     .select("*")');
    console.log('     .eq("invoice_no", "JKDP-INV-0004")');
    
    console.log('\n   // Display payment with readable invoice reference');
    console.log('   const paymentDisplay = await supabase');
    console.log('     .from("payments")');
    console.log('     .select("payment_number, amount, invoice_no, payment_date")');
    console.log('     .order("payment_date", { ascending: false })');
    
    console.log('\n💡 DUAL REFERENCE SYSTEM:');
    console.log('   • invoice_id (UUID): For database relationships and integrity');
    console.log('   • invoice_no (string): For frontend display and user queries');
    console.log('   • Best of both worlds - performance + usability!');
    
    console.log('\n🚀 READY FOR NEXT.JS DEVELOPMENT!');
    
    client.release();
    
  } catch (error) {
    console.error('Error updating payment invoice reference:', error);
  } finally {
    await pool.end();
  }
}

updatePaymentInvoiceReferenceFixed();
