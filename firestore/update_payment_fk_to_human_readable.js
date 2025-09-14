const { Pool } = require('pg');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./supabase-service.json', 'utf8'));
const pool = new Pool(config);

async function updatePaymentFKToHumanReadable() {
  const client = await pool.connect();
  
  try {
    console.log('=== UPDATING PAYMENT TABLE FK TO HUMAN-READABLE REFERENCES ===\n');
    
    console.log('1. Analyzing current payment table structure...');
    
    // Check current table structure
    const currentStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'payments' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('   📋 Current payments table structure:');
    currentStructure.rows.forEach(col => {
      console.log(`   ${col.column_name.padEnd(20)} ${col.data_type.padEnd(25)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check current foreign key constraints
    const currentConstraints = await client.query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'payments'
    `);
    
    console.log('\n   📋 Current foreign key constraints:');
    currentConstraints.rows.forEach(constraint => {
      console.log(`   ${constraint.constraint_name}: ${constraint.column_name} → ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
    });
    
    // Verify data integrity before changes
    console.log('\n2. Verifying data integrity...');
    
    const paymentCount = await client.query('SELECT COUNT(*) FROM payments');
    console.log(`   📊 Total payments: ${paymentCount.rows[0].count}`);
    
    // Check that all payments have human_id references
    const paymentsWithHumanRefs = await client.query(`
      SELECT 
        payment_number,
        customer_human_id,
        invoice_no,
        customer_id,
        invoice_id
      FROM payments 
      WHERE customer_human_id IS NOT NULL AND invoice_no IS NOT NULL
    `);
    
    console.log(`   ✅ Payments with human references: ${paymentsWithHumanRefs.rows.length}`);
    
    // Verify customer_human_id exists in customers table
    const validCustomerRefs = await client.query(`
      SELECT p.payment_number, p.customer_human_id
      FROM payments p
      JOIN customers c ON p.customer_human_id = c.human_id
    `);
    
    console.log(`   ✅ Valid customer_human_id references: ${validCustomerRefs.rows.length}`);
    
    // Verify invoice_no exists in invoices table
    const validInvoiceRefs = await client.query(`
      SELECT p.payment_number, p.invoice_no
      FROM payments p
      JOIN invoices i ON p.invoice_no = i."invoiceNo"
    `);
    
    console.log(`   ✅ Valid invoice_no references: ${validInvoiceRefs.rows.length}`);
    
    if (paymentsWithHumanRefs.rows.length !== parseInt(paymentCount.rows[0].count)) {
      throw new Error('Not all payments have human-readable references. Please run customer/invoice human_id setup first.');
    }
    
    console.log('\n3. Creating backup table...');
    await client.query('DROP TABLE IF EXISTS payments_backup_before_fk_change');
    await client.query('CREATE TABLE payments_backup_before_fk_change AS SELECT * FROM payments');
    console.log('   ✅ Backup table created: payments_backup_before_fk_change');
    
    console.log('\n4. Dropping existing foreign key constraints...');
    
    // Drop existing FK constraints
    for (const constraint of currentConstraints.rows) {
      await client.query(`ALTER TABLE payments DROP CONSTRAINT IF EXISTS ${constraint.constraint_name}`);
      console.log(`   ✅ Dropped constraint: ${constraint.constraint_name}`);
    }
    
    console.log('\n5. Dropping old UUID foreign key columns...');
    
    // Drop the UUID foreign key columns since we're replacing them with human-readable ones
    await client.query('ALTER TABLE payments DROP COLUMN IF EXISTS customer_id');
    await client.query('ALTER TABLE payments DROP COLUMN IF EXISTS invoice_id');
    console.log('   ✅ Dropped customer_id (UUID) column');
    console.log('   ✅ Dropped invoice_id (UUID) column');
    
    console.log('\n6. Setting human-readable columns as NOT NULL...');
    
    // Make human-readable columns NOT NULL since they're now the primary references
    await client.query('ALTER TABLE payments ALTER COLUMN customer_human_id SET NOT NULL');
    await client.query('ALTER TABLE payments ALTER COLUMN invoice_no SET NOT NULL');
    console.log('   ✅ Set customer_human_id as NOT NULL');
    console.log('   ✅ Set invoice_no as NOT NULL');
    
    console.log('\n7. Creating new foreign key constraints with human-readable references...');
    
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
    console.log('   ✅ Created FK: invoice_no → invoices.invoice_number');
    
    console.log('\n8. Updating indexes for performance...');
    
    // Ensure we have performance indexes on the new FK columns
    await client.query('CREATE INDEX IF NOT EXISTS idx_payments_customer_human_id ON payments(customer_human_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_payments_invoice_no ON payments(invoice_no)');
    console.log('   ✅ Created/verified performance indexes');
    
    console.log('\n9. Verifying the new structure...');
    
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
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'payments'
    `);
    
    console.log('\n   📋 New foreign key constraints:');
    newConstraints.rows.forEach(constraint => {
      console.log(`   ${constraint.constraint_name}: ${constraint.column_name} → ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
    });
    
    console.log('\n10. Testing the new foreign key relationships...');
    
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
    console.log('   ALTER TABLE payments_backup_before_fk_change RENAME TO payments;');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updatePaymentFKToHumanReadable();
