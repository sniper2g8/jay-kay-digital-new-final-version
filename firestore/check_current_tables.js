const { Pool } = require('pg');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./supabase-service.json', 'utf8'));
const pool = new Pool(config);

async function checkTables() {
  try {
    const client = await pool.connect();
    
    const tables = await client.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE '%backup%'
      ORDER BY table_name
    `);
    
    console.log('=== CURRENT PRODUCTION TABLES ===\n');
    tables.rows.forEach((table, i) => {
      console.log(`${(i+1).toString().padStart(2)}: ${table.table_name.padEnd(25)} (${table.column_count} columns)`);
    });
    
    console.log(`\n📊 Total Production Tables: ${tables.rows.length}`);
    
    // Check specific tables mentioned in prompt
    const promptTables = [
      'users', 'jobs', 'invoices', 'payments', 'inventory', 'expenses', 
      'notifications', 'job_tracking', 'file_uploads'
    ];
    
    const existingTables = tables.rows.map(t => t.table_name);
    
    console.log('\n=== PROMPT TABLES vs EXISTING ===\n');
    promptTables.forEach(table => {
      const exists = existingTables.includes(table);
      const alternative = getAlternative(table, existingTables);
      console.log(`${table.padEnd(15)} → ${exists ? '✅ EXISTS' : '❌ MISSING' + (alternative ? ` (Have: ${alternative})` : '')}`);
    });
    
    client.release();
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

function getAlternative(table, existing) {
  const alternatives = {
    'users': existing.find(t => ['appUsers', 'profiles'].includes(t)),
    'jobs': existing.find(t => t === 'jobs'),
    'invoices': existing.find(t => t === 'invoices'),
    'payments': existing.find(t => t === 'payments'),
    'inventory': existing.find(t => t === 'inventory'),
    'expenses': existing.find(t => t === 'expenses'),
    'notifications': existing.find(t => t === 'notifications'),
    'job_tracking': existing.find(t => ['job_activity_log', 'job_tracking'].includes(t)),
    'file_uploads': existing.find(t => ['file_attachments', 'file_uploads'].includes(t))
  };
  
  return alternatives[table];
}

checkTables();
