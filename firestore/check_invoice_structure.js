const { Pool } = require('pg');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./supabase-service.json', 'utf8'));
const pool = new Pool(config);

async function checkInvoiceTableStructure() {
  const client = await pool.connect();
  
  try {
    console.log('=== CHECKING INVOICES TABLE STRUCTURE ===\n');
    
    // Get column structure
    const invoiceStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'invoices' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Invoices table columns:');
    invoiceStructure.rows.forEach(col => {
      console.log(`   ${col.column_name.padEnd(20)} ${col.data_type.padEnd(25)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check for any column that might contain invoice numbers
    console.log('\n📊 Sample invoice data:');
    const sampleData = await client.query('SELECT * FROM invoices LIMIT 2');
    
    if (sampleData.rows.length > 0) {
      const firstInvoice = sampleData.rows[0];
      Object.keys(firstInvoice).forEach(key => {
        const value = firstInvoice[key];
        if (typeof value === 'string' && (value.includes('INV') || value.includes('JKDP'))) {
          console.log(`   ${key}: ${value} ⭐ (Potential invoice number)`);
        } else {
          console.log(`   ${key}: ${value}`);
        }
      });
    }
    
    // Check what the payment table invoice_no values look like
    console.log('\n📋 Payment table invoice_no values:');
    const paymentInvoiceNos = await client.query('SELECT DISTINCT invoice_no FROM payments WHERE invoice_no IS NOT NULL');
    paymentInvoiceNos.rows.forEach(row => {
      console.log(`   ${row.invoice_no}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkInvoiceTableStructure();
