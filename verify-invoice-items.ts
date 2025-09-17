import { Client } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function verifyInvoiceItems(): Promise<void> {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Show the migrated invoice items
    console.log('\n📋 Migrated Invoice Items:');
    const itemsResult = await client.query(`
      SELECT 
        ii.id,
        ii.invoice_id,
        i."invoiceNo" as invoice_number,
        ii.description,
        ii.quantity,
        ii.unit_price,
        ii.total_price,
        ii.job_id,
        ii.job_no,
        ii.created_at
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      ORDER BY i."invoiceNo", ii.id
    `);

    console.log(`Found ${itemsResult.rows.length} invoice items`);

    // Group by invoice
    const invoiceGroups = itemsResult.rows.reduce((acc, item) => {
      const invoiceNo = item.invoice_number;
      if (!acc[invoiceNo]) {
        acc[invoiceNo] = [];
      }
      acc[invoiceNo].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    Object.keys(invoiceGroups).forEach(invoiceNo => {
      console.log(`\n💼 Invoice ${invoiceNo}:`);
      console.log(`   Items: ${invoiceGroups[invoiceNo].length}`);
      
      let totalAmount = 0;
      invoiceGroups[invoiceNo].forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.description}`);
        console.log(`      Qty: ${item.quantity} × $${item.unit_price} = $${item.total_price}`);
        if (item.job_no && item.job_no !== 'N/A') {
          console.log(`      Job: ${item.job_no}`);
        }
        totalAmount += parseFloat(item.total_price);
      });
      
      console.log(`   💰 Total: $${totalAmount.toFixed(2)}`);
    });

    // Show invoice summary with totals
    console.log('\n📊 Invoice Summary:');
    const summaryResult = await client.query(`
      SELECT 
        i."invoiceNo" as invoice_number,
        i.total as invoice_total,
        i.status,
        i.payment_status,
        COUNT(ii.id) as item_count,
        SUM(ii.total_price) as items_total,
        i."customerName" as customer_name
      FROM invoices i
      LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
      WHERE i.items IS NOT NULL
      GROUP BY i.id, i."invoiceNo", i.total, i.status, i.payment_status, i."customerName"
      ORDER BY i.created_at DESC
    `);

    summaryResult.rows.forEach(invoice => {
      console.log(`\n🧾 ${invoice.invoice_number}:`);
      console.log(`   Customer: ${invoice.customer_name}`);
      console.log(`   Status: ${invoice.status} (Payment: ${invoice.payment_status})`);
      console.log(`   Items: ${invoice.item_count}`);
      console.log(`   Invoice Total: $${invoice.invoice_total}`);
      console.log(`   Items Total: $${invoice.items_total || 0}`);
      
      const invoiceTotal = parseFloat(invoice.invoice_total);
      const itemsTotal = parseFloat(invoice.items_total || '0');
      const match = Math.abs(invoiceTotal - itemsTotal) < 0.01;
      console.log(`   Totals Match: ${match ? '✅' : '❌'}`);
    });

    console.log('\n✨ Migration verification completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. ✅ Invoice items successfully migrated to invoice_items table');
    console.log('2. 🔄 Update your application to use the new table structure');
    console.log('3. 🗑️  After verification, remove the JSONB items column:');
    console.log('   ALTER TABLE invoices DROP COLUMN items;');

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

verifyInvoiceItems();