const { Pool } = require('pg');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./supabase-service.json', 'utf8'));
const pool = new Pool(config);

async function addHumanIdToCustomersAndUpdatePayments() {
  try {
    const client = await pool.connect();
    
    console.log('=== ADDING HUMAN_ID TO CUSTOMERS & UPDATING PAYMENTS ===\n');
    
    console.log('1. Analyzing current customers table...');
    
    // Check customers table structure
    const customersStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'customers' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('   📋 Current customers table structure:');
    customersStructure.rows.forEach(col => {
      console.log(`   ${col.column_name.padEnd(20)} ${col.data_type.padEnd(15)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check current customers data
    const customersData = await client.query('SELECT * FROM customers ORDER BY created_at');
    console.log(`\n   📊 Current customers (${customersData.rows.length} records):`);
    customersData.rows.forEach((customer, index) => {
      console.log(`   ${index + 1}. ID: ${customer.id} | Name: ${customer.name}`);
    });
    
    console.log('\n2. Checking current payment-customer relationships...');
    
    const paymentCustomers = await client.query(`
      SELECT 
        p.payment_number,
        p.customer_id,
        c.name as customer_name,
        p.amount
      FROM payments p
      LEFT JOIN customers c ON p.customer_id = c.id
      ORDER BY p.created_at
    `);
    
    console.log('   📊 Current payment-customer relationships:');
    paymentCustomers.rows.forEach(payment => {
      console.log(`   ${payment.payment_number}: ${payment.customer_id} → ${payment.customer_name} ($${payment.amount})`);
    });
    
    console.log('\n3. Creating backups...');
    
    // Backup customers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers_human_id_backup AS
      SELECT 
        *,
        NOW() as backup_timestamp,
        'Before adding human_id column' as backup_reason
      FROM customers
    `);
    
    // Backup payments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments_customer_human_id_backup AS
      SELECT 
        *,
        NOW() as backup_timestamp,
        'Before updating customer references' as backup_reason
      FROM payments
    `);
    
    console.log('   ✅ Backups created for customers and payments');
    
    console.log('\n4. Adding human_id column to customers table...');
    
    try {
      await client.query(`
        ALTER TABLE customers 
        ADD COLUMN IF NOT EXISTS human_id VARCHAR(20) UNIQUE
      `);
      console.log('   ✅ Added human_id column to customers');
    } catch (error) {
      console.log(`   ℹ️ Column might exist: ${error.message}`);
    }
    
    console.log('\n5. Generating human_id values for existing customers...');
    
    // Check current counter for customer IDs
    const customerCounter = await client.query(`
      SELECT last FROM counters WHERE counter_id = 'customer_id'
    `);
    
    let counter = customerCounter.rows[0]?.last || 0;
    
    // Generate human_id for each customer
    for (const customer of customersData.rows) {
      if (!customer.human_id) { // Only if not already set
        counter++;
        const humanId = `JKDP-CUS-${counter.toString().padStart(3, '0')}`;
        
        await client.query(`
          UPDATE customers 
          SET human_id = $1 
          WHERE id = $2 AND human_id IS NULL
        `, [humanId, customer.id]);
        
        console.log(`   ✅ ${customer.name}: ${humanId}`);
      }
    }
    
    // Update counter
    await client.query(`
      INSERT INTO counters (counter_id, last, created_at, updated_at)
      VALUES ('customer_id', $1, NOW(), NOW())
      ON CONFLICT (counter_id) 
      DO UPDATE SET last = $1, updated_at = NOW()
    `, [counter]);
    
    console.log(`   📈 Updated customer counter to: ${counter}`);
    
    console.log('\n6. Adding customer_human_id column to payments...');
    
    try {
      await client.query(`
        ALTER TABLE payments 
        ADD COLUMN IF NOT EXISTS customer_human_id VARCHAR(20)
      `);
      console.log('   ✅ Added customer_human_id column to payments');
    } catch (error) {
      console.log(`   ℹ️ Column might exist: ${error.message}`);
    }
    
    console.log('\n7. Populating customer_human_id in payments...');
    
    const updatePaymentsResult = await client.query(`
      UPDATE payments 
      SET customer_human_id = c.human_id
      FROM customers c
      WHERE payments.customer_id = c.id
      AND payments.customer_human_id IS NULL
    `);
    
    console.log(`   ✅ Updated ${updatePaymentsResult.rowCount} payment records with customer human_id`);
    
    console.log('\n8. Adding indexes for performance...');
    
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_customers_human_id 
        ON customers(human_id)
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_payments_customer_human_id 
        ON payments(customer_human_id)
      `);
      
      console.log('   ✅ Added indexes for human_id columns');
    } catch (error) {
      console.log(`   ℹ️ Indexes might exist: ${error.message}`);
    }
    
    console.log('\n9. Verifying the updates...');
    
    // Verify customers with human_id
    const verifyCustomers = await client.query(`
      SELECT id, name, human_id 
      FROM customers 
      ORDER BY human_id
    `);
    
    console.log('   📊 Customers with human_id:');
    verifyCustomers.rows.forEach(customer => {
      console.log(`   ${customer.human_id}: ${customer.name}`);
    });
    
    // Verify payments with customer_human_id
    const verifyPayments = await client.query(`
      SELECT 
        p.payment_number,
        p.customer_id,
        p.customer_human_id,
        p.invoice_no,
        p.amount,
        c.name as customer_name
      FROM payments p
      LEFT JOIN customers c ON p.customer_id = c.id
      ORDER BY p.created_at
    `);
    
    console.log('\n   📊 Payments with customer human_id:');
    verifyPayments.rows.forEach(payment => {
      const match = payment.customer_human_id ? '✅' : '❌';
      console.log(`   ${match} ${payment.payment_number}: ${payment.customer_human_id} (${payment.customer_name}) - ${payment.invoice_no}`);
    });
    
    console.log('\n10. Testing frontend-friendly queries...');
    
    // Test new query capabilities
    const testCustomerQuery = await client.query(`
      SELECT payment_number, amount, customer_human_id, invoice_no
      FROM payments 
      WHERE customer_human_id IS NOT NULL
      LIMIT 3
    `);
    
    console.log('   🧪 Test query - payments by customer human_id:');
    testCustomerQuery.rows.forEach(payment => {
      console.log(`   ${payment.payment_number}: ${payment.customer_human_id} paid $${payment.amount} for ${payment.invoice_no}`);
    });
    
    console.log('\n✅ CUSTOMER HUMAN_ID UPDATE COMPLETE!');
    
    console.log('\n🎯 FRONTEND BENEFITS:');
    console.log('   ✅ Human-readable customer references (JKDP-CUS-001 vs UUIDs)');
    console.log('   ✅ Simpler payment queries by customer');
    console.log('   ✅ Better user experience and debugging');
    console.log('   ✅ Consistent human_id system across all entities');
    
    console.log('\n📋 FRONTEND USAGE EXAMPLES:');
    console.log('\n   // Get all payments for a specific customer');
    console.log('   const customerPayments = await supabase');
    console.log('     .from("payments")');
    console.log('     .select("*")');
    console.log('     .eq("customer_human_id", "JKDP-CUS-001")');
    
    console.log('\n   // Get customer info with human_id');
    console.log('   const customer = await supabase');
    console.log('     .from("customers")');
    console.log('     .select("*")');
    console.log('     .eq("human_id", "JKDP-CUS-001")');
    console.log('     .single()');
    
    console.log('\n   // Payment display with readable references');
    console.log('   const paymentDisplay = await supabase');
    console.log('     .from("payments")');
    console.log('     .select("payment_number, amount, customer_human_id, invoice_no")');
    console.log('     .order("payment_date", { ascending: false })');
    
    console.log('\n💡 TRIPLE REFERENCE SYSTEM:');
    console.log('   • customer_id (UUID): For database relationships');
    console.log('   • customer_human_id (string): For frontend display');
    console.log('   • invoice_no (string): For invoice references');
    console.log('   • Complete human-readable payment system!');
    
    console.log('\n🚀 READY FOR NEXT.JS DEVELOPMENT WITH FULL HUMAN-READABLE SYSTEM!');
    
    client.release();
    
  } catch (error) {
    console.error('Error updating customer human_id system:', error);
  } finally {
    await pool.end();
  }
}

addHumanIdToCustomersAndUpdatePayments();
