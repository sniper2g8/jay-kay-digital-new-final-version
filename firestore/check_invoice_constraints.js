const { Pool } = require('pg');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./supabase-service.json', 'utf8'));
const pool = new Pool(config);

async function checkInvoiceConstraints() {
  const client = await pool.connect();
  
  try {
    console.log('=== CHECKING INVOICE TABLE CONSTRAINTS ===\n');
    
    console.log('📋 Current constraints on invoices table:');
    const constraints = await client.query(`
      SELECT tc.constraint_name, tc.constraint_type, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'invoices' AND tc.table_schema = 'public'
    `);
    
    constraints.rows.forEach(row => {
      console.log(`   ${row.constraint_name}: ${row.constraint_type} on ${row.column_name}`);
    });
    
    console.log('\n🔍 Checking if invoiceNo values are unique:');
    const duplicateCheck = await client.query(`
      SELECT "invoiceNo", COUNT(*) as count
      FROM invoices 
      WHERE "invoiceNo" IS NOT NULL
      GROUP BY "invoiceNo"
      HAVING COUNT(*) > 1
    `);
    
    if (duplicateCheck.rows.length === 0) {
      console.log('✅ All invoiceNo values are unique - safe to add unique constraint');
      
      // Check total count
      const totalCount = await client.query('SELECT COUNT(*) FROM invoices WHERE "invoiceNo" IS NOT NULL');
      console.log(`   Total invoices with invoiceNo: ${totalCount.rows[0].count}`);
      
      // Show sample values
      const sampleValues = await client.query('SELECT "invoiceNo" FROM invoices WHERE "invoiceNo" IS NOT NULL ORDER BY "invoiceNo" LIMIT 5');
      console.log('   Sample invoiceNo values:');
      sampleValues.rows.forEach(row => {
        console.log(`     ${row.invoiceNo}`);
      });
      
    } else {
      console.log('❌ Duplicate invoiceNo values found:');
      duplicateCheck.rows.forEach(row => {
        console.log(`   ${row.invoiceNo}: ${row.count} occurrences`);
      });
    }
    
    console.log('\n🔍 Checking if customers.human_id has unique constraint:');
    const customerConstraints = await client.query(`
      SELECT tc.constraint_name, tc.constraint_type, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'customers' AND tc.table_schema = 'public'
        AND kcu.column_name = 'human_id'
    `);
    
    if (customerConstraints.rows.length > 0) {
      console.log('✅ customers.human_id has constraints:');
      customerConstraints.rows.forEach(row => {
        console.log(`   ${row.constraint_name}: ${row.constraint_type}`);
      });
    } else {
      console.log('❌ customers.human_id has no unique constraint');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkInvoiceConstraints();
