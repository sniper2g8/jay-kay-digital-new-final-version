const { Pool } = require('pg');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./supabase-service.json', 'utf8'));
const pool = new Pool(config);

async function addUniqueConstraintAndUpdatePaymentFK() {
  const client = await pool.connect();
  
  try {
    console.log('=== ADDING UNIQUE CONSTRAINT AND UPDATING PAYMENT FK ===\n');
    
    console.log('1. Checking current state...');
    
    // Verify invoiceNo uniqueness
    const duplicateCheck = await client.query(`
      SELECT "invoiceNo", COUNT(*) as count
      FROM invoices 
      WHERE "invoiceNo" IS NOT NULL
      GROUP BY "invoiceNo"
      HAVING COUNT(*) > 1
    `);
    
    if (duplicateCheck.rows.length > 0) {
      throw new Error('Duplicate invoiceNo values found. Cannot add unique constraint.');
    }
    
    console.log('   ✅ All invoiceNo values are unique');
    
    console.log('\n2. Adding unique constraint to invoices.invoiceNo...');
    
    // Add unique constraint to invoiceNo
    await client.query(`
      ALTER TABLE invoices 
      ADD CONSTRAINT invoices_invoiceNo_unique 
      UNIQUE ("invoiceNo")
    `);
    
    console.log('   ✅ Added unique constraint: invoices_invoiceNo_unique');
    
    console.log('\n3. Verifying payment table data integrity...');
    
    const paymentCount = await client.query('SELECT COUNT(*) FROM payments');
    console.log(`   📊 Total payments: ${paymentCount.rows[0].count}`);
    
    // Check that all payments have human_id references
    const paymentsWithHumanRefs = await client.query(`
      SELECT COUNT(*) FROM payments 
      WHERE customer_human_id IS NOT NULL AND invoice_no IS NOT NULL
    `);
    
    console.log(`   ✅ Payments with human references: ${paymentsWithHumanRefs.rows[0].count}`);
    
    // Verify customer_human_id exists in customers table
    const validCustomerRefs = await client.query(`
      SELECT COUNT(*) FROM payments p
      JOIN customers c ON p.customer_human_id = c.human_id
    `);
    
    console.log(`   ✅ Valid customer_human_id references: ${validCustomerRefs.rows[0].count}`);
    
    // Verify invoice_no exists in invoices table
    const validInvoiceRefs = await client.query(`
      SELECT COUNT(*) FROM payments p
      JOIN invoices i ON p.invoice_no = i."invoiceNo"
    `);
    
    console.log(`   ✅ Valid invoice_no references: ${validInvoiceRefs.rows[0].count}`);
    
    if (paymentsWithHumanRefs.rows[0].count !== paymentCount.rows[0].count) {
      throw new Error('Not all payments have human-readable references.');
    }
    
    console.log('\n4. Creating backup table...');
    await client.query('DROP TABLE IF EXISTS payments_backup_fk_update');
    await client.query('CREATE TABLE payments_backup_fk_update AS SELECT * FROM payments');
    console.log('   ✅ Backup table created: payments_backup_fk_update');
    
    console.log('\n5. Checking current payment table constraints...');
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
    
    console.log('\n6. Dropping existing UUID foreign key constraints...');
    
    // Drop UUID-based foreign key constraints
    for (const constraint of currentConstraints.rows) {
      if (constraint.column_name === 'customer_id' || constraint.column_name === 'invoice_id') {
        await client.query(`ALTER TABLE payments DROP CONSTRAINT ${constraint.constraint_name}`);
        console.log(`   ✅ Dropped constraint: ${constraint.constraint_name}`);
      }
    }
    
    console.log('\n7. Dropping old UUID foreign key columns...');
    
    // Drop the UUID foreign key columns
    await client.query('ALTER TABLE payments DROP COLUMN IF EXISTS customer_id');
    await client.query('ALTER TABLE payments DROP COLUMN IF EXISTS invoice_id');
    console.log('   ✅ Dropped customer_id (UUID) column');
    console.log('   ✅ Dropped invoice_id (UUID) column');
    
    console.log('\n8. Setting human-readable columns as NOT NULL...');
    
    // Make human-readable columns NOT NULL since they're now the primary references
    await client.query('ALTER TABLE payments ALTER COLUMN customer_human_id SET NOT NULL');
    await client.query('ALTER TABLE payments ALTER COLUMN invoice_no SET NOT NULL');
    console.log('   ✅ Set customer_human_id as NOT NULL');
    console.log('   ✅ Set invoice_no as NOT NULL');
    
    console.log('\n9. Creating new foreign key constraints with human-readable references...');
    
    // Add foreign key constraint for customer_human_id
    await client.query(`
      ALTER TABLE payments 
      ADD CONSTRAINT fk_payments_customer_human_id 
      FOREIGN KEY (customer_human_id) 
      REFERENCES customers(human_id) 
      ON DELETE RESTRICT 
      ON UPDATE CASCADE
    `);
    console.log('   ✅ Created FK: customer_human_id → customers.human_id');
    
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
    
    console.log('\n10. Updating indexes for performance...');
    
    // Ensure we have performance indexes on the new FK columns
    await client.query('CREATE INDEX IF NOT EXISTS idx_payments_customer_human_id ON payments(customer_human_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_payments_invoice_no ON payments(invoice_no)');
    console.log('   ✅ Created/verified performance indexes');
    
    console.log('\n11. Verifying the new structure...');
    
    // Check new table structure
    const newStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'payments' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('   📋 New payments table structure:');
    newStructure.rows.forEach(col => {
      console.log(`   ${col.column_name.padEnd(20)} ${col.data_type.padEnd(25)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check new foreign key constraints
    const newConstraints = await client.query(`
      SELECT tc.constraint_name, kcu.column_name, ccu.table_name, ccu.column_name as foreign_column
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'payments'
    `);
    
    console.log('\n   📋 New foreign key constraints:');
    newConstraints.rows.forEach(constraint => {
      console.log(`   ${constraint.constraint_name}: ${constraint.column_name} → ${constraint.table_name}.${constraint.foreign_column}`);
    });
    
    console.log('\n12. Testing the new foreign key relationships...');
    
    // Test the relationships work
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
    
    console.log('   🧪 Test query results (payments with customer and invoice details):');
    testQuery.rows.forEach(row => {
      console.log(`   ${row.payment_number}: ${row.customer_human_id} (${row.customer_name}) - ${row.invoice_no} ($${row.amount})`);
    });
    
    console.log('\n✅ PAYMENT TABLE FK UPDATE COMPLETE!\n');
    
    console.log('🎯 BENEFITS ACHIEVED:');
    console.log('   ✅ Human-readable foreign keys (customer_human_id, invoice_no)');
    console.log('   ✅ Eliminated UUID complexity in payment relationships');
    console.log('   ✅ Simplified frontend queries - no more complex joins needed');
    console.log('   ✅ Referential integrity maintained with proper FK constraints');
    console.log('   ✅ Performance optimized with targeted indexes');
    console.log('   ✅ invoices.invoiceNo now has unique constraint for referential integrity');
    
    console.log('\n📋 FRONTEND QUERY EXAMPLES:');
    console.log('   // Get payments by customer (no join needed!)');
    console.log('   const payments = await supabase');
    console.log('     .from("payments")');
    console.log('     .select("payment_number, amount, invoice_no")');
    console.log('     .eq("customer_human_id", "JKDP-CUS-001")');
    console.log('');
    console.log('   // Get payments by invoice (direct reference!)'); 
    console.log('   const invoicePayments = await supabase');
    console.log('     .from("payments")');
    console.log('     .select("*")');
    console.log('     .eq("invoice_no", "JKDP-INV-0001")');
    
    console.log('\n🚀 PAYMENT TABLE NOW FULLY HUMAN-READABLE WITH PROPER FK CONSTRAINTS!');
    
  } catch (error) {
    console.error('❌ Error updating payment FK structure:', error.message);
    console.log('\n🔄 To restore from backup if needed:');
    console.log('   DROP TABLE payments;');
    console.log('   ALTER TABLE payments_backup_fk_update RENAME TO payments;');
    console.log('   -- Also restore the original FK constraints if needed');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addUniqueConstraintAndUpdatePaymentFK();
