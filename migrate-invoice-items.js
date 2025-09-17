const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Database connection using direct URL from .env.local
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function migrateInvoiceItems() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // First, let's examine the current invoices with JSONB items
    console.log('\n📋 Current invoices with JSONB items:');
    const invoicesResult = await client.query(`
      SELECT 
        id,
        invoice_number,
        items,
        total_amount,
        created_at
      FROM invoices 
      WHERE items IS NOT NULL 
      ORDER BY created_at DESC
    `);

    console.log(`Found ${invoicesResult.rows.length} invoices with items data`);
    
    for (const invoice of invoicesResult.rows) {
      console.log(`\nInvoice ${invoice.invoice_number} (ID: ${invoice.id}):`);
      console.log('Items JSONB:', JSON.stringify(invoice.items, null, 2));
      console.log('Total Amount:', invoice.total_amount);
    }

    // Check if invoice_items table exists and its structure
    console.log('\n📊 Checking invoice_items table structure:');
    const tableStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'invoice_items' 
      ORDER BY ordinal_position
    `);

    if (tableStructure.rows.length === 0) {
      console.log('❌ invoice_items table does not exist. Creating it...');
      
      // Create invoice_items table
      await client.query(`
        CREATE TABLE invoice_items (
          id BIGSERIAL PRIMARY KEY,
          invoice_id BIGINT REFERENCES invoices(id) ON DELETE CASCADE,
          description TEXT NOT NULL,
          quantity DECIMAL(10,2) DEFAULT 1,
          unit_price DECIMAL(10,2) NOT NULL,
          total_price DECIMAL(10,2) NOT NULL,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // Add RLS policy
      await client.query(`
        ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
      `);

      await client.query(`
        CREATE POLICY "Users can view invoice items for their organization" ON invoice_items
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_items.invoice_id
          )
        );
      `);

      await client.query(`
        CREATE POLICY "Users can manage invoice items for their organization" ON invoice_items
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_items.invoice_id
          )
        );
      `);

      console.log('✅ Created invoice_items table with RLS policies');
    } else {
      console.log('✅ invoice_items table exists');
      tableStructure.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
    }

    // Now migrate the JSONB items to the invoice_items table
    console.log('\n🔄 Starting migration of JSONB items to invoice_items table...');

    let totalItemsMigrated = 0;

    for (const invoice of invoicesResult.rows) {
      console.log(`\n📝 Processing Invoice ${invoice.invoice_number}...`);
      
      if (!invoice.items || !Array.isArray(invoice.items)) {
        console.log(`  ⚠️ No valid items array found for invoice ${invoice.invoice_number}`);
        continue;
      }

      // Check if items already exist for this invoice
      const existingItems = await client.query(`
        SELECT COUNT(*) as count FROM invoice_items WHERE invoice_id = $1
      `, [invoice.id]);

      if (existingItems.rows[0].count > 0) {
        console.log(`  ℹ️ Invoice ${invoice.invoice_number} already has ${existingItems.rows[0].count} items in invoice_items table`);
        continue;
      }

      // Process each item in the JSONB array
      for (let i = 0; i < invoice.items.length; i++) {
        const item = invoice.items[i];
        console.log(`  📄 Processing item ${i + 1}:`, item);

        // Extract item data with fallbacks for different possible structures
        const description = item.description || item.name || item.service || `Item ${i + 1}`;
        const quantity = parseFloat(item.quantity) || 1;
        const unitPrice = parseFloat(item.unit_price || item.unitPrice || item.price || 0);
        const totalPrice = parseFloat(item.total_price || item.totalPrice || item.total || (quantity * unitPrice));

        // Insert the item
        const insertResult = await client.query(`
          INSERT INTO invoice_items (
            invoice_id,
            description,
            quantity,
            unit_price,
            total_price,
            notes
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `, [
          invoice.id,
          description,
          quantity,
          unitPrice,
          totalPrice,
          item.notes || null
        ]);

        console.log(`    ✅ Created invoice_item with ID: ${insertResult.rows[0].id}`);
        totalItemsMigrated++;
      }

      console.log(`  ✅ Migrated ${invoice.items.length} items for Invoice ${invoice.invoice_number}`);
    }

    // Verify migration
    console.log('\n🔍 Verifying migration results:');
    const verificationResult = await client.query(`
      SELECT 
        i.invoice_number,
        i.total_amount as invoice_total,
        COUNT(ii.id) as item_count,
        SUM(ii.total_price) as items_total
      FROM invoices i
      LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
      WHERE i.items IS NOT NULL
      GROUP BY i.id, i.invoice_number, i.total_amount
      ORDER BY i.created_at DESC
    `);

    console.log('\nMigration Summary:');
    verificationResult.rows.forEach(row => {
      console.log(`Invoice ${row.invoice_number}:`);
      console.log(`  Items migrated: ${row.item_count}`);
      console.log(`  Invoice total: $${row.invoice_total}`);
      console.log(`  Sum of items: $${row.items_total || 0}`);
      console.log(`  Match: ${Math.abs(parseFloat(row.invoice_total) - parseFloat(row.items_total || 0)) < 0.01 ? '✅' : '❌'}`);
    });

    console.log(`\n🎉 Migration completed! Total items migrated: ${totalItemsMigrated}`);

    // Ask if user wants to remove the JSONB items column
    console.log('\n⚠️  NEXT STEPS:');
    console.log('1. Verify the migrated data is correct');
    console.log('2. Update your application code to use the invoice_items table');
    console.log('3. Once verified, you can remove the JSONB items column with:');
    console.log('   ALTER TABLE invoices DROP COLUMN items;');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the migration
if (require.main === module) {
  migrateInvoiceItems()
    .then(() => {
      console.log('✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateInvoiceItems };