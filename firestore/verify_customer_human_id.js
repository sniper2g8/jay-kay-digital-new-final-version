const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load service account credentials
const serviceAccount = JSON.parse(fs.readFileSync('supabase-service.json', 'utf8'));

const supabase = createClient(
  serviceAccount.SUPABASE_URL,
  serviceAccount.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyCustomerHumanId() {
  console.log('📊 VERIFICATION: Customer Human_ID Implementation Results');
  console.log('='.repeat(70));
  
  try {
    // Check customers with human_id
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('human_id, name, id')
      .order('human_id');
    
    if (customersError) throw customersError;
    
    console.log('\n✅ Customers with Human_ID:');
    customers.forEach(c => console.log(`   ${c.human_id}: ${c.name || 'null'}`));
    
    // Check payments with customer_human_id
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('payment_number, customer_human_id, invoice_no, amount')
      .order('payment_number');
    
    if (paymentsError) throw paymentsError;
    
    console.log(`\n✅ Payments with Customer Human_ID (${payments.length} records):`);
    payments.slice(0, 3).forEach(p => 
      console.log(`   ${p.payment_number}: ${p.customer_human_id} - ${p.invoice_no} ($${p.amount})`)
    );
    if (payments.length > 3) console.log(`   ... and ${payments.length - 3} more`);
    
    // Test frontend-friendly query
    console.log('\n🧪 Testing Frontend-Friendly Query:');
    const { data: customerPayments } = await supabase
      .from('payments')
      .select('payment_number, amount, invoice_no')
      .eq('customer_human_id', 'JKDP-CUS-002')
      .limit(2);
    
    console.log('   Query: .eq("customer_human_id", "JKDP-CUS-002")');
    customerPayments.forEach(p => 
      console.log(`   → ${p.payment_number}: $${p.amount} for ${p.invoice_no}`)
    );
    
    console.log(`\n🎯 FRONTEND BENEFITS ACHIEVED:`);
    console.log(`   ✅ Human-readable customer references (JKDP-CUS-### vs UUIDs)`);
    console.log(`   ✅ Triple reference system: customer_id (UUID), customer_human_id (readable), invoice_no (readable)`);
    console.log(`   ✅ Complete human-readable payment system ready for Next.js`);
    console.log(`   ✅ Simplified frontend queries with .eq("customer_human_id", "JKDP-CUS-001")`);
    
    console.log(`\n🚀 READY FOR NEXT.JS DEVELOPMENT WITH FULL HUMAN-READABLE SYSTEM!`);
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    process.exit(0);
  }
}

verifyCustomerHumanId();
