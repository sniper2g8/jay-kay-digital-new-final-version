import { Client } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function cleanupJsonbItems(): Promise<void> {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Final verification before cleanup
    console.log('\n🔍 Final verification before removing JSONB items column...');
    
    const verificationResult = await client.query(`
      SELECT 
        i."invoiceNo" as invoice_number,
        i.total as invoice_total,
        COUNT(ii.id) as item_count,
        SUM(ii.total_price) as items_total
      FROM invoices i
      LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
      WHERE i.items IS NOT NULL
      GROUP BY i.id, i."invoiceNo", i.total
      ORDER BY i.created_at DESC
    `);

    console.log('\n📊 Current Migration Status:');
    let allMatch = true;
    verificationResult.rows.forEach(row => {
      const invoiceTotal = parseFloat(row.invoice_total);
      const itemsTotal = parseFloat(row.items_total || '0');
      const match = Math.abs(invoiceTotal - itemsTotal) < 0.01;
      
      console.log(`Invoice ${row.invoice_number}:`);
      console.log(`  Items migrated: ${row.item_count}`);
      console.log(`  Totals match: ${match ? '✅' : '❌'}`);
      
      if (!match) allMatch = false;
    });

    if (!allMatch) {
      console.log('\n❌ Migration verification failed! Not removing JSONB column.');
      return;
    }

    console.log('\n✅ All invoice totals match! Safe to proceed.');
    console.log('\n⚠️  WARNING: This will permanently remove the JSONB items column.');
    console.log('📝 Make sure you have a database backup before proceeding.');
    
    // Uncomment the line below to actually remove the column
    // await client.query('ALTER TABLE invoices DROP COLUMN items;');
    
    console.log('\n💡 To remove the JSONB items column, uncomment this line in the script:');
    console.log('   await client.query(\'ALTER TABLE invoices DROP COLUMN items;\');');
    console.log('\n🔧 Then run the script again to complete the cleanup.');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

cleanupJsonbItems();