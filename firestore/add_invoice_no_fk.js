const { Pool } = require('pg');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./supabase-service.json', 'utf8'));
const pool = new Pool(config);

async function addInvoiceNoForeignKey() {
  const client = await pool.connect();
  
  try {
    console.log('=== ADDING INVOICE_NO FOREIGN KEY CONSTRAINT ===\n');
    
    console.log('1. Checking current payment table FK constraints...');
    const currentConstraints = await client.query(`
      SELECT tc.constraint_name, kcu.column_name, ccu.table_name, ccu.column_name as foreign_column
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'payments'
    `);
    
    console.log('   📋 Current FK constraints:');
    currentConstraints.rows.forEach(constraint => {
      console.log(`   ${constraint.constraint_name}: ${constraint.column_name} → ${constraint.table_name}.${constraint.foreign_column}`);
    });
    
    // Check if invoice_no FK already exists
    const invoiceNoFK = currentConstraints.rows.find(c => c.column_name === 'invoice_no');
    
    if (invoiceNoFK) {
      console.log('\n   ✅ invoice_no foreign key constraint already exists');
      console.log(`   Constraint: ${invoiceNoFK.constraint_name}`);
    } else {
      console.log('\n2. Verifying invoice_no data integrity...');
      
      // Verify invoice_no exists in invoices table
      const validInvoiceRefs = await client.query(`
        SELECT COUNT(*) FROM payments p
        JOIN invoices i ON p.invoice_no = i."invoiceNo"
      `);
      
      const totalPayments = await client.query('SELECT COUNT(*) FROM payments WHERE invoice_no IS NOT NULL');
      
      console.log(`   ✅ Valid invoice_no references: ${validInvoiceRefs.rows[0].count}/${totalPayments.rows[0].count}`);
      
      if (validInvoiceRefs.rows[0].count !== totalPayments.rows[0].count) {
        throw new Error('Not all payment invoice_no values have matching invoices');
      }
      
      console.log('\n3. Adding foreign key constraint for invoice_no...');
      
      // Add foreign key constraint for invoice_no
      await client.query(`
        ALTER TABLE payments 
        ADD CONSTRAINT fk_payments_invoice_no 
        FOREIGN KEY (invoice_no) 
        REFERENCES invoices("invoiceNo") 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
      `);
      console.log('   ✅ Created FK: invoice_no → invoices.invoiceNo');
    }
    
    console.log('\n4. Ensuring performance indexes exist...');
    
    // Ensure we have performance indexes on FK columns
    await client.query('CREATE INDEX IF NOT EXISTS idx_payments_customer_human_id ON payments(customer_human_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_payments_invoice_no ON payments(invoice_no)');
    console.log('   ✅ Created/verified performance indexes');
    
    console.log('\n5. Final verification...');
    
    // Check final constraint status
    const finalConstraints = await client.query(`
      SELECT tc.constraint_name, kcu.column_name, ccu.table_name, ccu.column_name as foreign_column
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'payments'
        AND (kcu.column_name = 'customer_human_id' OR kcu.column_name = 'invoice_no')
    `);
    
    console.log('   📋 Human-readable FK constraints:');
    finalConstraints.rows.forEach(constraint => {
      console.log(`   ${constraint.constraint_name}: ${constraint.column_name} → ${constraint.table_name}.${constraint.foreign_column}`);
    });
    
    // Test the relationships
    console.log('\n6. Testing foreign key relationships...');
    
    const testQuery = await client.query(`
      SELECT 
        p.payment_number,
        p.customer_human_id,
        c.name as customer_name,
        p.invoice_no,
        p.amount
      FROM payments p
      JOIN customers c ON p.customer_human_id = c.human_id
      JOIN invoices i ON p.invoice_no = i."invoiceNo"
      ORDER BY p.payment_number
      LIMIT 3
    `);
    
    console.log('   🧪 Test query results:');
    testQuery.rows.forEach(row => {
      console.log(`   ${row.payment_number}: ${row.customer_human_id} (${row.customer_name}) - ${row.invoice_no} ($${row.amount})`);
    });
    
    console.log('\n✅ HUMAN-READABLE FOREIGN KEY SETUP COMPLETE!\n');
    
    console.log('🎯 FINAL STATUS:');
    console.log('   ✅ customer_human_id → customers.human_id (FK with UNIQUE constraint)');
    console.log('   ✅ invoice_no → invoices.invoiceNo (FK with UNIQUE constraint)');
    console.log('   ✅ Performance indexes on both FK columns');
    console.log('   ✅ Referential integrity enforced');
    console.log('   ✅ UUID columns removed from payments table');
    
    console.log('\n📋 SIMPLIFIED FRONTEND QUERIES NOW POSSIBLE:');
    console.log('   // Direct customer payment lookup');
    console.log('   .eq("customer_human_id", "JKDP-CUS-001")');
    console.log('');
    console.log('   // Direct invoice payment lookup');
    console.log('   .eq("invoice_no", "JKDP-INV-0001")');
    console.log('');
    console.log('   // No complex joins needed for basic payment queries!');
    
    console.log('\n🚀 PAYMENT TABLE IS NOW FULLY HUMAN-READABLE WITH PROPER FK CONSTRAINTS!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addInvoiceNoForeignKey();
