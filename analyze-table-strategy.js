const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pnoxqzlxfuvjvufdjuqh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBub3hxemx4ZnV2anZ1ZmRqdXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczOTMxMzMsImV4cCI6MjA3Mjk2OTEzM30.QG0B60xV9TO2PaUeEOkzgqXcVuSkHVq3yYfXWKaaDzc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeTableStrategy() {
  console.log('🎯 Table Relationship Strategy Analysis\n');
  
  // 1. Analyze appUsers roles
  console.log('=== 1. appUsers Role Distribution ===');
  try {
    const { data: appUsers } = await supabase
      .from('appUsers')
      .select('name, email, primary_role, human_id');
      
    if (appUsers) {
      const roleGroups = {};
      appUsers.forEach(user => {
        if (!roleGroups[user.primary_role]) {
          roleGroups[user.primary_role] = [];
        }
        roleGroups[user.primary_role].push(user.name);
      });
      
      Object.entries(roleGroups).forEach(([role, users]) => {
        console.log(`${role}: ${users.length} users`);
        users.forEach(name => console.log(`  - ${name}`));
      });
    }
  } catch (err) {
    console.log('❌ appUsers analysis failed:', err.message);
  }

  // 2. Analyze customers structure  
  console.log('\n=== 2. customers Table Structure ===');
  try {
    const { data: customers } = await supabase
      .from('customers')
      .select('id, human_id, business_name, contact_person, email')
      .limit(5);
      
    if (customers) {
      console.log(`Found ${customers.length} customer records:`);
      customers.forEach(c => {
        console.log(`  - ${c.business_name || 'No business name'}`);
        console.log(`    Contact: ${c.contact_person || 'None'}`);
        console.log(`    Email: ${c.email || 'None'}`);
        console.log(`    ID: ${c.human_id}`);
        console.log('');
      });
    }
  } catch (err) {
    console.log('❌ customers analysis failed:', err.message);
  }

  // 3. Find email conflicts
  console.log('=== 3. Email Conflicts Analysis ===');
  try {
    const { data: appUsers } = await supabase.from('appUsers').select('email, name, primary_role');
    const { data: customers } = await supabase.from('customers').select('business_name, email, contact_person');
    
    if (appUsers && customers) {
      const userEmails = new Set(appUsers.map(u => u.email));
      const conflicts = customers.filter(c => c.email && userEmails.has(c.email));
      
      if (conflicts.length > 0) {
        console.log(`⚠️ Found ${conflicts.length} email conflicts:`);
        conflicts.forEach(conflict => {
          const user = appUsers.find(u => u.email === conflict.email);
          console.log(`  - ${conflict.email}:`);
          console.log(`    User: ${user.name} (${user.primary_role})`);
          console.log(`    Customer: ${conflict.business_name}`);
        });
      } else {
        console.log('✅ No email conflicts found');
      }
    }
  } catch (err) {
    console.log('❌ Conflict analysis failed:', err.message);
  }

  console.log('\n=== 4. Recommended Actions ===');
  console.log('Based on analysis:');
  console.log('');
  console.log('KEEP SEPARATE:');
  console.log('✅ appUsers: All user accounts (staff + customer users)');
  console.log('✅ customers: Business entities (companies/organizations)');
  console.log('');
  console.log('FIX PROFILES:');
  console.log('🔄 Make profiles a VIEW of appUsers for auth compatibility');
  console.log('🔄 Remove redundant data storage');
  console.log('');
  console.log('RESOLVE CONFLICTS:');
  console.log('🔧 Link customers to appUsers via contact_person_id');
  console.log('🔧 Remove duplicate emails between tables');
}

analyzeTableStrategy().catch(console.error);