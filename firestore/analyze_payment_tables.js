const { Pool } = require('pg');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./supabase-service.json', 'utf8'));
const pool = new Pool(config);

async function analyzePaymentTables() {
  try {
    const client = await pool.connect();
    
    console.log('=== PAYMENT TABLES ANALYSIS ===\n');
    
    // Check invoice_payments table structure
    const invoicePaymentsCols = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'invoice_payments' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 invoice_payments table (11 columns):');
    invoicePaymentsCols.rows.forEach(col => {
      console.log(`   ${col.column_name.padEnd(20)} ${col.data_type.padEnd(15)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check payments table structure  
    const paymentsCols = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 payments table (12 columns):');
    paymentsCols.rows.forEach(col => {
      console.log(`   ${col.column_name.padEnd(20)} ${col.data_type.padEnd(15)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check data overlap
    const invoicePaymentsCount = await client.query('SELECT COUNT(*) as count FROM invoice_payments');
    const paymentsCount = await client.query('SELECT COUNT(*) as count FROM payments');
    
    console.log('\n📈 DATA COUNTS:');
    console.log(`   invoice_payments: ${invoicePaymentsCount.rows[0].count} records`);
    console.log(`   payments: ${paymentsCount.rows[0].count} records`);
    
    // Check foreign key relationships
    const fkConstraints = await client.query(`
      SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND (tc.table_name IN ('invoice_payments', 'payments'))
    `);
    
    console.log('\n🔗 FOREIGN KEY RELATIONSHIPS:');
    fkConstraints.rows.forEach(fk => {
      console.log(`   ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    
    // Sample data comparison
    const sampleInvoicePayments = await client.query('SELECT * FROM invoice_payments LIMIT 3');
    const samplePayments = await client.query('SELECT * FROM payments LIMIT 3');
    
    console.log('\n📋 SAMPLE DATA COMPARISON:');
    console.log('   invoice_payments sample:', sampleInvoicePayments.rows.length > 0 ? 'Has data' : 'No data');
    console.log('   payments sample:', samplePayments.rows.length > 0 ? 'Has data' : 'No data');
    
    console.log('\n💡 MERGER ANALYSIS:');
    console.log('   ✅ invoice_payments: Specific to invoice payments');
    console.log('   ✅ payments: General payment tracking');
    console.log('   🎯 RECOMMENDATION: Merge into unified payments table');
    
    console.log('\n🔧 MERGER STRATEGY:');
    console.log('   1. Backup both tables');
    console.log('   2. Combine columns from both tables');
    console.log('   3. Migrate invoice_payments data to payments');
    console.log('   4. Update foreign key references');
    console.log('   5. Drop invoice_payments table');
    
    client.release();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

analyzePaymentTables();
