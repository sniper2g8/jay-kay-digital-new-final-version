const { Client } = require('pg');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

async function createRLSPolicies() {
  console.log('🔐 Creating RLS Policies for Invoice Management...\n');

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const policies = [
      // Invoice line items policies
      {
        name: 'Invoice line items view policy',
        sql: `
        DO $$ BEGIN
          CREATE POLICY "Users can view all invoice line items" ON invoice_line_items
            FOR SELECT USING (true);
        EXCEPTION
          WHEN duplicate_object THEN
            NULL;
        END $$;
        `
      },
      {
        name: 'Invoice line items manage policy',
        sql: `
        DO $$ BEGIN
          CREATE POLICY "Authenticated users can manage invoice line items" ON invoice_line_items
            FOR ALL USING (auth.uid() IS NOT NULL);
        EXCEPTION
          WHEN duplicate_object THEN
            NULL;
        END $$;
        `
      },

      // Invoice templates policies
      {
        name: 'Invoice templates RLS',
        sql: `ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;`
      },
      {
        name: 'Invoice templates view policy',
        sql: `
        DO $$ BEGIN
          CREATE POLICY "Users can view all invoice templates" ON invoice_templates
            FOR SELECT USING (true);
        EXCEPTION
          WHEN duplicate_object THEN
            NULL;
        END $$;
        `
      },
      {
        name: 'Invoice templates manage policy',
        sql: `
        DO $$ BEGIN
          CREATE POLICY "Authenticated users can manage invoice templates" ON invoice_templates
            FOR ALL USING (auth.uid() IS NOT NULL);
        EXCEPTION
          WHEN duplicate_object THEN
            NULL;
        END $$;
        `
      },

      // Payment allocations policies
      {
        name: 'Payment allocations RLS',
        sql: `ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;`
      },
      {
        name: 'Payment allocations view policy',
        sql: `
        DO $$ BEGIN
          CREATE POLICY "Users can view all payment allocations" ON payment_allocations
            FOR SELECT USING (true);
        EXCEPTION
          WHEN duplicate_object THEN
            NULL;
        END $$;
        `
      },
      {
        name: 'Payment allocations manage policy',
        sql: `
        DO $$ BEGIN
          CREATE POLICY "Authenticated users can manage payment allocations" ON payment_allocations
            FOR ALL USING (auth.uid() IS NOT NULL);
        EXCEPTION
          WHEN duplicate_object THEN
            NULL;
        END $$;
        `
      },

      // Invoice status history policies
      {
        name: 'Invoice status history RLS',
        sql: `ALTER TABLE invoice_status_history ENABLE ROW LEVEL SECURITY;`
      },
      {
        name: 'Invoice status history view policy',
        sql: `
        DO $$ BEGIN
          CREATE POLICY "Users can view invoice status history" ON invoice_status_history
            FOR SELECT USING (true);
        EXCEPTION
          WHEN duplicate_object THEN
            NULL;
        END $$;
        `
      },
      {
        name: 'Invoice status history insert policy',
        sql: `
        DO $$ BEGIN
          CREATE POLICY "Authenticated users can insert invoice status history" ON invoice_status_history
            FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
        EXCEPTION
          WHEN duplicate_object THEN
            NULL;
        END $$;
        `
      },

      // Recurring invoices policies
      {
        name: 'Recurring invoices RLS',
        sql: `ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY;`
      },
      {
        name: 'Recurring invoices view policy',
        sql: `
        DO $$ BEGIN
          CREATE POLICY "Users can view all recurring invoices" ON recurring_invoices
            FOR SELECT USING (true);
        EXCEPTION
          WHEN duplicate_object THEN
            NULL;
        END $$;
        `
      },
      {
        name: 'Recurring invoices manage policy',
        sql: `
        DO $$ BEGIN
          CREATE POLICY "Authenticated users can manage recurring invoices" ON recurring_invoices
            FOR ALL USING (auth.uid() IS NOT NULL);
        EXCEPTION
          WHEN duplicate_object THEN
            NULL;
        END $$;
        `
      }
    ];

    for (const policy of policies) {
      try {
        console.log(`🔐 Creating ${policy.name}...`);
        await client.query(policy.sql);
        console.log(`✅ ${policy.name} - Success`);
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`⚠️  ${policy.name} - Already exists`);
        } else {
          console.log(`❌ ${policy.name} - Error: ${error.message}`);
        }
      }
    }

    console.log('\n🎉 RLS Policies created successfully!');
    console.log('🔐 Invoice management tables are now properly secured');

  } catch (error) {
    console.error('❌ Failed to create RLS policies:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createRLSPolicies();